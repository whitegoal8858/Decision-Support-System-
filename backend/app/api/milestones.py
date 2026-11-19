from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.core.database import get_db
from app.models.models import Milestone, Project, AuditLog
from app.schemas.schemas import MilestoneCreate, MilestoneUpdate, MilestoneOut
from app.api.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/milestones", tags=["Milestones"])

def check_overdue(m: Milestone) -> bool:
    today = date.today()
    return m.planned_end < today and m.completion_percent < 100.0 and m.status != "Completed"

@router.get("", response_model=List[MilestoneOut])
def list_all_milestones(db: Session = Depends(get_db), current_user = Depends(get_current_user_optional)):
    query = db.query(Milestone)
    
    # Nodal Officer Scope
    if current_user and current_user.role == "monitor" and getattr(current_user, 'assigned_district', None):
        query = query.join(Project).filter(Project.district.ilike(f"%{current_user.assigned_district}%"))
    # Vendor Scope
    elif current_user and current_user.role == "vendor" and getattr(current_user, 'assigned_project_id', None):
        query = query.join(Project).filter(
            (Project.project_id == current_user.assigned_project_id) |
            (Project.external_project_id == current_user.assigned_project_id)
        )
        
    milestones = query.all()
    results = []
    for m in milestones:
        m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
        m_dict["is_overdue"] = check_overdue(m)
        results.append(MilestoneOut(**m_dict))
    return results

@router.post("", response_model=MilestoneOut)
def create_milestone(payload: MilestoneCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    m = Milestone(**payload.dict(), is_synthetic=False)
    db.add(m)
    db.commit()
    db.refresh(m)
    
    m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
    m_dict["is_overdue"] = check_overdue(m)
    return MilestoneOut(**m_dict)

@router.put("/{milestone_id}", response_model=MilestoneOut)
def update_milestone(milestone_id: str, payload: MilestoneUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    m = db.query(Milestone).filter(Milestone.milestone_id == milestone_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Milestone not found")
        
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(m, key, val)
        
    if m.completion_percent >= 100.0:
        m.status = "Completed"
        if not m.actual_end:
            m.actual_end = date.today()
            
    db.commit()
    db.refresh(m)
    m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
    m_dict["is_overdue"] = check_overdue(m)
    return MilestoneOut(**m_dict)
