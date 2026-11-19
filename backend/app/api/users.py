from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import User, AuditLog
from app.schemas.schemas import UserOut, UserCreate, AuditLogOut
from app.core.security import get_password_hash
from app.api.deps import get_current_user, require_admin

router = APIRouter(tags=["User Management & Governance"])

@router.get("/users", response_model=List[UserOut])
def list_system_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()

@router.post("/users", response_model=UserOut)
def create_system_user(payload: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
        
    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        department=payload.department or ("Contractor Agency" if payload.role == "vendor" else "Department of Tourism & Culture, UP"),
        designation=payload.designation or ("Site In-Charge" if payload.role == "vendor" else "Project Officer"),
        role=payload.role or "vendor",
        vendor_company=payload.vendor_company,
        assigned_project_id=payload.assigned_project_id,
        is_active=True
    )
    db.add(new_user)
    db.flush()
    
    audit = AuditLog(
        actor_name=current_user.full_name,
        action="REGISTER_VENDOR" if payload.role == "vendor" else "CREATE_USER",
        entity_type="User",
        entity_id=new_user.user_id,
        after_value={
            "email": payload.email, 
            "role": payload.role, 
            "vendor_company": payload.vendor_company,
            "assigned_project_id": payload.assigned_project_id
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_trail(limit: int = Query(50), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AuditLog).order_by(AuditLog.action_timestamp.desc()).limit(limit).all()
