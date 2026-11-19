from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database import get_db
from app.models.models import ProgressUpdate, Project, AuditLog
from app.schemas.schemas import ProgressUpdateCreate, ProgressUpdateOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/progress", tags=["Progress Monitoring"])

@router.get("", response_model=List[ProgressUpdateOut])
def list_progress_updates(project_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ProgressUpdate)
    if project_id:
        query = query.filter(ProgressUpdate.project_id == project_id)
    return query.order_by(ProgressUpdate.report_date.desc()).all()

@router.post("", response_model=ProgressUpdateOut)
def submit_progress_update(payload: ProgressUpdateCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.project_id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # RBAC: If vendor, verify that the vendor is assigned to this project
    is_vendor = getattr(current_user, 'role', '') == 'vendor'
    if is_vendor:
        assigned = getattr(current_user, 'assigned_project_id', '')
        if assigned and project.project_id != assigned and project.external_project_id != assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: You are registered as vendor for project '{assigned}'. You cannot submit progress for other projects."
            )
        
        # Vendor submissions require official department verification
        verification_status = "Pending"
        verified_by = None
        submitted_by = f"{current_user.full_name} ({getattr(current_user, 'vendor_company', 'Contractor')})"
    else:
        # Admin / Monitor submission is directly verified
        verification_status = "Verified"
        verified_by = current_user.full_name if hasattr(current_user, 'full_name') else "Official"
        submitted_by = current_user.full_name if hasattr(current_user, 'full_name') else "Department Officer"
        
    update_data = payload.dict()
    update_data.pop("submitted_by", None)

    upd = ProgressUpdate(
        **update_data,
        submitted_by=submitted_by,
        verified_by=verified_by,
        verification_status=verification_status,
        is_synthetic=False
    )
    db.add(upd)
    
    # Update project status if verified and 100%
    if verification_status == "Verified" and payload.progress_percent >= 100.0:
        project.project_status = "Completed"
        
    audit = AuditLog(
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="VENDOR_SUBMIT_PROGRESS" if is_vendor else "SUBMIT_PROGRESS_UPDATE",
        entity_type="ProgressUpdate",
        entity_id=upd.update_id,
        after_value={**payload.dict(), "verification_status": verification_status}
    )
    db.add(audit)
    db.commit()
    db.refresh(upd)
    return upd

@router.put("/{update_id}/verify", response_model=ProgressUpdateOut)
def verify_vendor_progress(update_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if getattr(current_user, 'role', '') not in ['admin', 'monitor']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Department Administrators and Nodal Officers can verify vendor progress updates."
        )

    upd = db.query(ProgressUpdate).filter(ProgressUpdate.update_id == update_id).first()
    if not upd:
        raise HTTPException(status_code=404, detail="Progress update not found")

    upd.verification_status = "Verified"
    upd.verified_by = current_user.full_name

    project = db.query(Project).filter(Project.project_id == upd.project_id).first()
    if project and upd.progress_percent >= 100.0:
        project.project_status = "Completed"

    audit = AuditLog(
        actor_name=current_user.full_name,
        action="VERIFY_VENDOR_PROGRESS",
        entity_type="ProgressUpdate",
        entity_id=upd.update_id,
        after_value={"verification_status": "Verified", "verified_by": current_user.full_name}
    )
    db.add(audit)
    db.commit()
    db.refresh(upd)
    return upd
