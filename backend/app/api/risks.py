from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.models import IssueRisk, Project, AuditLog
from app.schemas.schemas import IssueRiskCreate, IssueRiskUpdate, IssueRiskOut, RiskAlertOut
from app.services.risk_engine import evaluate_all_risks, evaluate_project_risks
from app.api.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/risks", tags=["Risks & Issues"])

@router.get("/alerts", response_model=List[RiskAlertOut])
def get_rule_based_alerts(
    project_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Evaluates explainable rule-based alerts dynamically against current database state.
    """
    if project_id:
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        alerts = evaluate_project_risks(project, db)
    else:
        alerts = evaluate_all_risks(db)
        
    # Nodal Officer Scope: Restrict alerts to projects in their district
    if current_user and current_user.role == "monitor" and getattr(current_user, 'assigned_district', None):
        user_dist = current_user.assigned_district.lower()
        district_pids = {p.project_id for p in db.query(Project.project_id).filter(Project.district.ilike(f"%{user_dist}%")).all()}
        alerts = [a for a in alerts if a.project_id in district_pids]
    elif current_user and current_user.role == "vendor" and getattr(current_user, 'assigned_project_id', None):
        alerts = [a for a in alerts if a.project_id == current_user.assigned_project_id or getattr(a, 'project_code', None) == current_user.assigned_project_id]

    if severity:
        alerts = [a for a in alerts if a.severity.upper() == severity.upper()]
    if category:
        alerts = [a for a in alerts if category.lower() in a.risk_category.lower()]
        
    return alerts

@router.get("/issues", response_model=List[IssueRiskOut])
def list_issues(project_id: Optional[str] = Query(None), status_filter: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(IssueRisk)
    if project_id:
        query = query.filter(IssueRisk.project_id == project_id)
    if status_filter:
        query = query.filter(IssueRisk.resolution_status == status_filter)
    return query.order_by(IssueRisk.opened_date.desc()).all()

@router.post("/issues", response_model=IssueRiskOut)
def log_issue(payload: IssueRiskCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    issue = IssueRisk(**payload.dict(), is_synthetic=False)
    db.add(issue)
    
    audit = AuditLog(
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="LOG_PROJECT_ISSUE",
        entity_type="IssueRisk",
        entity_id=issue.issue_id,
        after_value=payload.dict()
    )
    db.add(audit)
    db.commit()
    db.refresh(issue)
    return issue

@router.put("/issues/{issue_id}", response_model=IssueRiskOut)
def update_issue_status(
    issue_id: str,
    payload: IssueRiskUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    issue = db.query(IssueRisk).filter(IssueRisk.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(issue, k, v)
        
    if issue.resolution_status == "CLOSED" and not issue.closure_date:
        issue.closure_date = date.today()
        
    db.commit()
    db.refresh(issue)
    return issue
