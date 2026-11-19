from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.models import (
    Project, Milestone, ProgressUpdate, FinancialTransaction,
    Contract, IssueRisk, Inspection, Document, AuditLog, User
)
from app.schemas.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

def enrich_project_metrics(project: Project, db: Session) -> ProjectOut:
    spent = sum(t.amount_spent for t in project.financial_transactions if t.amount_spent)
    released = sum(t.amount_released for t in project.financial_transactions if t.amount_released)
    baseline = project.revised_budget if (project.revised_budget and project.revised_budget > 0) else project.approved_budget
    fin_util = round((spent / baseline * 100.0), 1) if baseline > 0 else 0.0
    
    latest_update = (
        db.query(ProgressUpdate)
        .filter(ProgressUpdate.project_id == project.project_id)
        .order_by(ProgressUpdate.report_date.desc())
        .first()
    )
    phys_prog = latest_update.progress_percent if latest_update else (100.0 if project.project_status == "Completed" else 0.0)
    gap = round(fin_util - phys_prog, 1)
    
    variance = round((project.revised_budget - project.approved_budget), 2) if project.revised_budget else 0.0
    
    # Overdue milestones count
    today = datetime.utcnow().date()
    overdue_count = sum(1 for m in project.milestones if m.planned_end < today and m.completion_percent < 100.0 and m.status != "Completed")
    
    # Open risks count
    open_risks = sum(1 for r in project.issues_risks if r.resolution_status != "CLOSED")
    
    p_dict = {c.name: getattr(project, c.name) for c in project.__table__.columns}
    if not p_dict.get("awarded_vendor") and project.contracts:
        p_dict["awarded_vendor"] = project.contracts[0].awarded_vendor
    p_dict["total_spent"] = spent
    p_dict["total_released"] = released
    p_dict["financial_utilisation_percent"] = fin_util
    p_dict["physical_progress_percent"] = phys_prog
    p_dict["physical_financial_gap"] = gap
    p_dict["budget_variance"] = variance
    p_dict["overdue_milestones_count"] = overdue_count
    p_dict["open_risks_count"] = open_risks
    
    return ProjectOut(**p_dict)

@router.get("", response_model=List[ProjectOut])
def list_projects(
    search: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    scheme: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project)
    
    # RBAC Vendor Filter: Vendors only see their assigned project(s)
    if current_user and current_user.role == "vendor":
        if current_user.assigned_project_id:
            query = query.filter(
                (Project.project_id == current_user.assigned_project_id) |
                (Project.external_project_id == current_user.assigned_project_id)
            )
        elif current_user.vendor_company:
            query = query.filter(Project.implementing_agency.ilike(f"%{current_user.vendor_company}%"))
            
    # RBAC Nodal Officer Filter: Nodal Project in-charge only sees their assigned district / zone
    if current_user and current_user.role == "monitor":
        if getattr(current_user, 'assigned_district', None):
            query = query.filter(Project.district.ilike(f"%{current_user.assigned_district}%"))
        elif getattr(current_user, 'assigned_zone', None):
            query = query.filter(Project.district.ilike(f"%{current_user.assigned_zone}%"))
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Project.project_name.ilike(search_filter)) |
            (Project.external_project_id.ilike(search_filter)) |
            (Project.district.ilike(search_filter)) |
            (Project.implementing_agency.ilike(search_filter))
        )
    if district:
        query = query.filter(Project.district == district)
    if scheme:
        query = query.filter(Project.scheme_name == scheme)
    if status:
        query = query.filter(Project.project_status == status)
    if category:
        query = query.filter(Project.category == category)
        
    projects = query.all()
    enriched = [enrich_project_metrics(p, db) for p in projects]
    
    # Sorting
    reverse = (order.lower() == "desc")
    if sort_by == "budget":
        enriched.sort(key=lambda x: x.approved_budget, reverse=reverse)
    elif sort_by == "progress":
        enriched.sort(key=lambda x: x.physical_progress_percent or 0.0, reverse=reverse)
    elif sort_by == "name":
        enriched.sort(key=lambda x: x.project_name.lower(), reverse=reverse)
    else:
        enriched.sort(key=lambda x: x.created_at, reverse=reverse)
        
    return enriched

@router.post("", response_model=ProjectOut)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user and current_user.role == "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendors are not authorized to create project master records. Only Department Admins and Nodal Officers can register projects."
        )
    existing = db.query(Project).filter(Project.external_project_id == payload.external_project_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with external ID '{payload.external_project_id}' already exists."
        )
        
    new_project = Project(**payload.dict(), is_synthetic=False)
    db.add(new_project)
    db.flush()

    if payload.awarded_vendor:
        from app.models.models import Contract
        contract = Contract(
            project_id=new_project.project_id,
            tender_reference=f"TND/{new_project.external_project_id}/2026",
            tender_date=payload.start_date,
            awarded_vendor=payload.awarded_vendor,
            contract_value=payload.approved_budget,
            contract_status="Active",
            is_synthetic=False
        )
        db.add(contract)
    
    # Audit log
    audit = AuditLog(
        actor_id=current_user.user_id if hasattr(current_user, 'user_id') else None,
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="CREATE_PROJECT",
        entity_type="Project",
        entity_id=new_project.project_id,
        after_value=payload.dict()
    )
    db.add(audit)
    
    db.commit()
    db.refresh(new_project)
    return enrich_project_metrics(new_project, db)

@router.get("/{project_id}")
def get_project_details(project_id: str, db: Session = Depends(get_db)):
    project = (
        db.query(Project)
        .filter((Project.project_id == project_id) | (Project.external_project_id == project_id))
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    base_metrics = enrich_project_metrics(project, db)
    
    # Return full related relations
    return {
        "project": base_metrics,
        "milestones": project.milestones,
        "progress_updates": sorted(project.progress_updates, key=lambda x: x.report_date, reverse=True),
        "financial_transactions": sorted(project.financial_transactions, key=lambda x: x.transaction_date, reverse=True),
        "contracts": project.contracts,
        "issues_risks": project.issues_risks,
        "inspections": sorted(project.inspections, key=lambda x: x.inspection_date, reverse=True),
        "documents": project.documents
    }

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    before_state = {k: str(getattr(project, k)) for k in payload.dict(exclude_unset=True).keys()}
    
    for key, val in payload.dict(exclude_unset=True).items():
        setattr(project, key, val)
        
    audit = AuditLog(
        actor_id=current_user.user_id if hasattr(current_user, 'user_id') else None,
        actor_name=current_user.full_name if hasattr(current_user, 'full_name') else "Official",
        action="UPDATE_PROJECT",
        entity_type="Project",
        entity_id=project.project_id,
        before_value=before_state,
        after_value={k: str(val) for k, val in payload.dict(exclude_unset=True).items()}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(project)
    return enrich_project_metrics(project, db)
