from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.models import FinancialTransaction, Project, ProgressUpdate, AuditLog
from app.schemas.schemas import FinancialTransactionCreate, FinancialTransactionOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/financials", tags=["Financial Monitoring"])

@router.get("/transactions", response_model=List[FinancialTransactionOut])
def list_transactions(project_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(FinancialTransaction)
    if project_id:
        query = query.filter(FinancialTransaction.project_id == project_id)
    return query.order_by(FinancialTransaction.transaction_date.desc()).all()

@router.post("/transactions", response_model=FinancialTransactionOut)
def record_financial_transaction(
    payload: FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tx = FinancialTransaction(**payload.dict(), is_synthetic=False)
    db.add(tx)
    
    audit = AuditLog(
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="RECORD_FINANCIAL_TRANSACTION",
        entity_type="FinancialTransaction",
        entity_id=tx.transaction_id,
        after_value=payload.dict()
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)
    return tx

@router.get("/summary")
def get_financial_summary(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    
    total_approved = sum(p.approved_budget for p in projects)
    total_revised = sum(p.revised_budget or p.approved_budget for p in projects)
    total_spent = db.query(func.sum(FinancialTransaction.amount_spent)).scalar() or 0.0
    total_released = db.query(func.sum(FinancialTransaction.amount_released)).scalar() or 0.0
    
    baseline = total_revised if total_revised > 0 else total_approved
    overall_utilisation = round(total_spent / baseline * 100.0, 1) if baseline > 0 else 0.0
    
    # Project-wise financial vs physical analysis
    project_financials = []
    gap_count = 0
    for p in projects:
        spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
        released = sum(t.amount_released for t in p.financial_transactions if t.amount_released)
        p_base = p.revised_budget if (p.revised_budget and p.revised_budget > 0) else p.approved_budget
        base_label = "Revised Sanction" if p.revised_budget else "Approved DPR Sanction"
        p_util = round(spent / p_base * 100.0, 1) if p_base > 0 else 0.0
        
        latest_upd = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
        phys_prog = latest_upd.progress_percent if latest_upd else (100.0 if p.project_status == "Completed" else 0.0)
        gap = round(p_util - phys_prog, 1)
        
        is_gap_flagged = gap > 15.0 and p.project_status != "Completed"
        if is_gap_flagged:
            gap_count += 1
            
        project_financials.append({
            "project_id": p.project_id,
            "external_project_id": p.external_project_id,
            "project_name": p.project_name,
            "district": p.district,
            "approved_budget": p.approved_budget,
            "revised_budget": p.revised_budget,
            "baseline_used": base_label,
            "amount_released": released,
            "amount_spent": spent,
            "utilisation_percent": p_util,
            "physical_progress_percent": phys_prog,
            "variance_gap": gap,
            "gap_flagged": is_gap_flagged,
            "status": p.project_status
        })

    return {
        "total_approved_budget": total_approved,
        "total_revised_budget": total_revised,
        "total_released": total_released,
        "total_spent": total_spent,
        "overall_utilisation_percent": overall_utilisation,
        "baseline_rule": "Financial utilisation % = Amount spent / selected baseline budget * 100 (Revised if sanctioned, else Approved)",
        "gap_flagged_count": gap_count,
        "project_financials": project_financials
    }
