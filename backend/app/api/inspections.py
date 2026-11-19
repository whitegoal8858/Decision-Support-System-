from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Inspection, Project, AuditLog
from app.schemas.schemas import InspectionCreate, InspectionOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/inspections", tags=["Inspections"])

@router.get("", response_model=List[InspectionOut])
def list_inspections(project_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Inspection)
    if project_id:
        query = query.filter(Inspection.project_id == project_id)
    return query.order_by(Inspection.inspection_date.desc()).all()

@router.post("", response_model=InspectionOut)
def record_inspection(payload: InspectionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    insp = Inspection(**payload.dict(), is_synthetic=False)
    db.add(insp)
    
    audit = AuditLog(
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="RECORD_INSPECTION",
        entity_type="Inspection",
        entity_id=insp.inspection_id,
        after_value=payload.dict()
    )
    db.add(audit)
    db.commit()
    db.refresh(insp)
    return insp
