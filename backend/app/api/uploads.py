import os
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.database import get_db
from app.models.models import IngestionJob, User
from app.services.ingestion import (
    parse_uploaded_file, validate_ingestion_data, commit_ingested_data,
    STANDARD_PROJECT_COLUMNS, STANDARD_FINANCIAL_COLUMNS, STANDARD_MILESTONE_COLUMNS
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/uploads", tags=["Data Ingestion"])

@router.post("")
async def upload_data_file(
    file: UploadFile = File(...),
    target_entity: str = Form("project"), # "project", "financial", "milestone"
    source_publisher: Optional[str] = Form("Department of Tourism, UP"),
    source_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate extension
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ["csv", "xlsx", "xls", "pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload CSV, XLSX, or PDF."
        )
        
    job_id = str(uuid.uuid4())
    saved_filename = f"{job_id}_{file.filename}"
    saved_filepath = os.path.join(settings.UPLOAD_DIR, saved_filename)
    
    # Save file to disk
    contents = await file.read()
    with open(saved_filepath, "wb") as f:
        f.write(contents)
        
    try:
        rows, headers, total_rows = parse_uploaded_file(saved_filepath, file_ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    # Generate default auto column mapping
    target_columns = (
        STANDARD_PROJECT_COLUMNS if target_entity == "project" else
        (STANDARD_FINANCIAL_COLUMNS if target_entity == "financial" else STANDARD_MILESTONE_COLUMNS)
    )
    
    default_mapping = {}
    for h in headers:
        clean_h = h.lower().strip()
        matched = False
        for tc in target_columns:
            if clean_h == tc or clean_h in tc or tc in clean_h:
                default_mapping[h] = tc
                matched = True
                break
        if not matched:
            default_mapping[h] = None

    # Run initial validation
    validation_report = validate_ingestion_data(rows, target_entity, default_mapping, db)
    
    job = IngestionJob(
        job_id=job_id,
        file_name=file.filename,
        file_type=file_ext,
        file_path=saved_filepath,
        source_publisher=source_publisher,
        source_url=source_url,
        status="PENDING_REVIEW",
        total_rows=total_rows,
        valid_rows=validation_report["valid_count"],
        invalid_rows=validation_report["invalid_count"],
        column_mapping_json=default_mapping,
        parsed_data_json=rows[:100], # Keep top 100 rows preview in job state
        validation_report_json=validation_report,
        created_by=current_user.full_name if hasattr(current_user, 'full_name') else "Official"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return {
        "job_id": job.job_id,
        "file_name": job.file_name,
        "total_rows": total_rows,
        "headers": headers,
        "target_entity": target_entity,
        "column_mapping": default_mapping,
        "validation_report": validation_report,
        "status": job.status
    }

@router.get("/{job_id}/status")
def get_upload_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(IngestionJob).filter(IngestionJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Ingestion job not found")
        
    return {
        "job_id": job.job_id,
        "file_name": job.file_name,
        "file_type": job.file_type,
        "status": job.status,
        "total_rows": job.total_rows,
        "valid_rows": job.valid_rows,
        "invalid_rows": job.invalid_rows,
        "column_mapping": job.column_mapping_json,
        "validation_report": job.validation_report_json,
        "created_at": job.created_at,
        "created_by": job.created_by
    }

@router.post("/{job_id}/commit")
def commit_upload_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        result = commit_ingested_data(
            job_id=job_id,
            db=db,
            confirmed_by=current_user.full_name if hasattr(current_user, 'full_name') else "Official"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
