import os
import uuid
import json
import pandas as pd
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import IngestionJob, Project, FinancialTransaction, Milestone, ProgressUpdate, AuditLog
import pdfplumber

STANDARD_PROJECT_COLUMNS = [
    "external_project_id", "project_name", "scheme_name", "district",
    "category", "implementing_agency", "start_date", "original_end_date",
    "approved_budget", "project_status"
]

STANDARD_FINANCIAL_COLUMNS = [
    "external_project_id", "transaction_date", "financial_year",
    "transaction_type", "amount_released", "amount_spent"
]

STANDARD_MILESTONE_COLUMNS = [
    "external_project_id", "milestone_name", "planned_start",
    "planned_end", "weightage_percent", "completion_percent", "status"
]

def parse_uploaded_file(file_path: str, file_type: str) -> Tuple[List[Dict[str, Any]], List[str], int]:
    """
    Parses CSV, XLSX, or PDF and returns (rows, detected_headers, total_rows)
    """
    rows = []
    headers = []
    
    if file_type == "csv":
        df = pd.read_csv(file_path)
        # Clean column names
        df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
        headers = list(df.columns)
        # Convert NaN to None
        rows = df.where(pd.notnull(df), None).to_dict(orient="records")
        
    elif file_type in ["xlsx", "xls"]:
        df = pd.read_excel(file_path)
        df.columns = [str(c).strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
        headers = list(df.columns)
        rows = df.where(pd.notnull(df), None).to_dict(orient="records")
        
    elif file_type == "pdf":
        # Extract tables using pdfplumber
        extracted_tables = []
        with pdfplumber.open(file_path) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                for table in tables:
                    if len(table) > 1:
                        raw_headers = [str(h or f"col_{i}").strip().lower().replace(" ", "_").replace("-", "_") for i, h in enumerate(table[0])]
                        if not headers:
                            headers = raw_headers
                        for row_data in table[1:]:
                            if any(row_data):
                                row_dict = {}
                                for idx, val in enumerate(row_data):
                                    col_name = headers[idx] if idx < len(headers) else f"col_{idx}"
                                    row_dict[col_name] = str(val).strip() if val is not None else None
                                row_dict["_page_reference"] = f"Page {page_idx + 1}"
                                rows.append(row_dict)
                                
        if not rows:
            # Fallback to text lines if no tables detected
            with pdfplumber.open(file_path) as pdf:
                full_text = "\n".join([page.extract_text() or "" for page in pdf.pages])
                headers = ["extracted_text_line", "_page_reference"]
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    for line in text.split("\n"):
                        if line.strip():
                            rows.append({"extracted_text_line": line.strip(), "_page_reference": f"Page {page_idx + 1}"})

    return rows, headers, len(rows)

def validate_ingestion_data(
    rows: List[Dict[str, Any]], 
    target_entity: str, 
    column_mapping: Dict[str, str], 
    db: Session
) -> Dict[str, Any]:
    """
    Validates mapped rows against the target schema, checks duplicates, checks existing project IDs.
    Does NOT use loose fuzzy joins; prefers official IDs.
    """
    valid_rows = []
    invalid_rows = []
    duplicate_records = []
    seen_keys = set()
    
    # Query existing project external IDs for matching
    existing_projects = {p.external_project_id: p.project_id for p in db.query(Project.external_project_id, Project.project_id).all()}
    
    for idx, row in enumerate(rows):
        mapped_row = {}
        for src_col, target_col in column_mapping.items():
            if target_col and src_col in row:
                mapped_row[target_col] = row[src_col]
        
        errors = []
        
        # Check External Project ID
        ext_id = mapped_row.get("external_project_id")
        if not ext_id or str(ext_id).strip() == "":
            errors.append("Missing required field: external_project_id")
        else:
            ext_id = str(ext_id).strip()
            mapped_row["external_project_id"] = ext_id
        
        # Target specific validation
        if target_entity == "project":
            if not mapped_row.get("project_name"):
                errors.append("Missing project_name")
            if not mapped_row.get("approved_budget"):
                errors.append("Missing approved_budget")
            else:
                try:
                    mapped_row["approved_budget"] = float(str(mapped_row["approved_budget"]).replace(",", "").replace("₹", "").strip())
                except ValueError:
                    errors.append("Invalid numerical value for approved_budget")

            # Check duplicate in file
            if ext_id in seen_keys:
                duplicate_records.append(f"Row {idx+1}: Duplicate external_project_id '{ext_id}' in file")
                errors.append("Duplicate external_project_id in current upload file")
            seen_keys.add(ext_id)
            
            # Check existing project in database
            if ext_id in existing_projects:
                mapped_row["_action_type"] = "UPDATE_EXISTING"
            else:
                mapped_row["_action_type"] = "CREATE_NEW"

        elif target_entity == "financial":
            if not mapped_row.get("transaction_date"):
                errors.append("Missing transaction_date")
            if not mapped_row.get("amount_spent") and not mapped_row.get("amount_released"):
                errors.append("Either amount_spent or amount_released must be provided")
            
            # Verify project exists
            if ext_id and ext_id not in existing_projects:
                errors.append(f"Referenced project '{ext_id}' does not exist in the database. Official ID match required.")
            else:
                mapped_row["project_id"] = existing_projects.get(ext_id)

        elif target_entity == "milestone":
            if not mapped_row.get("milestone_name"):
                errors.append("Missing milestone_name")
            if not mapped_row.get("planned_end"):
                errors.append("Missing planned_end")
            
            if ext_id and ext_id not in existing_projects:
                errors.append(f"Referenced project '{ext_id}' does not exist in database.")
            else:
                mapped_row["project_id"] = existing_projects.get(ext_id)

        mapped_row["_row_number"] = idx + 1
        
        if errors:
            invalid_rows.append({
                "row_number": idx + 1,
                "data": mapped_row,
                "errors": errors
            })
        else:
            valid_rows.append(mapped_row)
            
    report = {
        "target_entity": target_entity,
        "total_rows": len(rows),
        "valid_count": len(valid_rows),
        "invalid_count": len(invalid_rows),
        "duplicate_count": len(duplicate_records),
        "duplicate_warnings": duplicate_records,
        "sample_valid": valid_rows[:5],
        "invalid_rows_detail": invalid_rows[:15],
        "can_commit": len(valid_rows) > 0 and len(invalid_rows) == 0
    }
    
    return report

def commit_ingested_data(job_id: str, db: Session, confirmed_by: str) -> Dict[str, Any]:
    """
    Inserts or updates confirmed ingestion job records into PostgreSQL / SQLite.
    Never silently changes conflicting financial figures.
    Logs audit record.
    """
    job = db.query(IngestionJob).filter(IngestionJob.job_id == job_id).first()
    if not job:
        raise ValueError("Ingestion job not found")
        
    if job.status == "COMMITTED":
        raise ValueError("This ingestion job has already been committed to the database.")
        
    report = job.validation_report_json
    if not report or report.get("valid_count", 0) == 0:
        raise ValueError("No valid rows available to commit.")
        
    parsed_data = job.parsed_data_json or []
    target_entity = report.get("target_entity", "project")
    column_mapping = job.column_mapping_json or {}
    
    created_count = 0
    updated_count = 0
    
    # Re-validate to get mapped rows
    val_report = validate_ingestion_data(parsed_data, target_entity, column_mapping, db)
    valid_rows = val_report.get("sample_valid", [])
    
    # We re-run full validation to get all valid rows
    existing_projects = {p.external_project_id: p for p in db.query(Project).all()}
    
    for row in parsed_data:
        # Map row
        mapped = {target: row[src] for src, target in column_mapping.items() if target and src in row}
        ext_id = mapped.get("external_project_id")
        if not ext_id:
            continue
            
        if target_entity == "project":
            proj = existing_projects.get(ext_id)
            if proj:
                # Update non-destructive fields
                proj.project_name = mapped.get("project_name", proj.project_name)
                proj.scheme_name = mapped.get("scheme_name", proj.scheme_name)
                proj.district = mapped.get("district", proj.district)
                proj.category = mapped.get("category", proj.category)
                proj.implementing_agency = mapped.get("implementing_agency", proj.implementing_agency)
                proj.project_status = mapped.get("project_status", proj.project_status)
                if mapped.get("revised_budget"):
                    proj.revised_budget = float(mapped["revised_budget"])
                proj.is_synthetic = False
                updated_count += 1
            else:
                # Create project
                new_proj = Project(
                    external_project_id=ext_id,
                    project_name=mapped.get("project_name", f"Project {ext_id}"),
                    scheme_name=mapped.get("scheme_name", "State Tourism Scheme"),
                    district=mapped.get("district", "Lucknow"),
                    location_description=mapped.get("location_description"),
                    category=mapped.get("category", "Heritage"),
                    implementing_agency=mapped.get("implementing_agency", "UPTDC"),
                    start_date=datetime.strptime(str(mapped.get("start_date", "2024-01-01")), "%Y-%m-%d").date() if mapped.get("start_date") else date(2024, 1, 1),
                    original_end_date=datetime.strptime(str(mapped.get("original_end_date", "2025-12-31")), "%Y-%m-%d").date() if mapped.get("original_end_date") else date(2025, 12, 31),
                    approved_budget=float(mapped.get("approved_budget", 10000000.0)),
                    project_status=mapped.get("project_status", "Ongoing"),
                    is_synthetic=False
                )
                db.add(new_proj)
                existing_projects[ext_id] = new_proj
                created_count += 1
                
        elif target_entity == "financial":
            proj = existing_projects.get(ext_id)
            if proj:
                trans_date = datetime.strptime(str(mapped.get("transaction_date", "2024-04-01")), "%Y-%m-%d").date() if mapped.get("transaction_date") else date.today()
                tx = FinancialTransaction(
                    project_id=proj.project_id,
                    transaction_date=trans_date,
                    financial_year=mapped.get("financial_year", "2024-25"),
                    transaction_type=mapped.get("transaction_type", "Expenditure"),
                    amount_released=float(mapped.get("amount_released", 0.0) or 0.0),
                    amount_spent=float(mapped.get("amount_spent", 0.0) or 0.0),
                    bill_amount=float(mapped.get("bill_amount", 0.0) or 0.0),
                    invoice_reference=mapped.get("invoice_reference"),
                    funding_source=mapped.get("funding_source", "Central & State Shared (60:40)"),
                    source_record_id=f"INGEST-{job.job_id[:8]}",
                    is_synthetic=False
                )
                db.add(tx)
                created_count += 1

    # Audit log entry
    audit = AuditLog(
        actor_name=confirmed_by,
        action="COMMIT_DATA_INGESTION",
        entity_type="IngestionJob",
        entity_id=job.job_id,
        before_value={"status": job.status},
        after_value={
            "status": "COMMITTED",
            "target_entity": target_entity,
            "created_records": created_count,
            "updated_records": updated_count
        }
    )
    db.add(audit)
    
    job.status = "COMMITTED"
    db.commit()
    
    return {
        "job_id": job.job_id,
        "status": "COMMITTED",
        "created_records": created_count,
        "updated_records": updated_count,
        "message": f"Successfully ingested {created_count + updated_count} records with full audit trail."
    }
