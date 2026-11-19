from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# --- Auth ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: Optional[str] = "Department of Tourism & Culture, UP"
    designation: Optional[str] = "Project Officer"
    role: Optional[str] = "monitor"
    vendor_company: Optional[str] = None
    assigned_project_id: Optional[str] = None
    assigned_district: Optional[str] = None
    assigned_zone: Optional[str] = None

class UserOut(BaseModel):
    user_id: str
    email: str
    full_name: str
    department: str
    designation: str
    role: str
    vendor_company: Optional[str] = None
    assigned_project_id: Optional[str] = None
    assigned_district: Optional[str] = None
    assigned_zone: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Project ---
class ProjectBase(BaseModel):
    external_project_id: str
    project_name: str
    scheme_name: str
    district: str
    location_description: Optional[str] = None
    category: str
    implementing_agency: str
    awarded_vendor: Optional[str] = None
    project_manager: Optional[str] = None
    start_date: date
    original_end_date: date
    revised_end_date: Optional[date] = None
    project_status: str = "Ongoing"
    approved_budget: float
    revised_budget: Optional[float] = None
    currency: str = "INR"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    scheme_name: Optional[str] = None
    district: Optional[str] = None
    location_description: Optional[str] = None
    category: Optional[str] = None
    implementing_agency: Optional[str] = None
    awarded_vendor: Optional[str] = None
    project_manager: Optional[str] = None
    start_date: Optional[date] = None
    original_end_date: Optional[date] = None
    revised_end_date: Optional[date] = None
    project_status: Optional[str] = None
    approved_budget: Optional[float] = None
    revised_budget: Optional[float] = None

class ProjectOut(ProjectBase):
    project_id: str
    is_synthetic: bool
    created_at: datetime
    updated_at: datetime
    
    # Computed metrics
    total_spent: Optional[float] = 0.0
    total_released: Optional[float] = 0.0
    financial_utilisation_percent: Optional[float] = 0.0
    physical_progress_percent: Optional[float] = 0.0
    physical_financial_gap: Optional[float] = 0.0
    budget_variance: Optional[float] = 0.0
    overdue_milestones_count: Optional[int] = 0
    open_risks_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Milestones ---
class MilestoneBase(BaseModel):
    milestone_name: str
    planned_start: date
    planned_end: date
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    weightage_percent: float = 0.0
    completion_percent: float = 0.0
    dependency_milestone_id: Optional[str] = None
    status: str = "Pending"
    remarks: Optional[str] = None

class MilestoneCreate(MilestoneBase):
    project_id: str

class MilestoneUpdate(BaseModel):
    milestone_name: Optional[str] = None
    planned_start: Optional[date] = None
    planned_end: Optional[date] = None
    actual_start: Optional[date] = None
    actual_end: Optional[date] = None
    weightage_percent: Optional[float] = None
    completion_percent: Optional[float] = None
    dependency_milestone_id: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class MilestoneOut(MilestoneBase):
    milestone_id: str
    project_id: str
    is_overdue: Optional[bool] = False
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Progress Updates ---
class ProgressUpdateCreate(BaseModel):
    project_id: str
    report_date: date
    work_component: str
    planned_quantity: Optional[float] = None
    completed_quantity: Optional[float] = None
    unit: Optional[str] = None
    progress_percent: float
    submitted_by: Optional[str] = None
    remarks: Optional[str] = None
    source_record_id: Optional[str] = None

class ProgressUpdateOut(BaseModel):
    update_id: str
    project_id: str
    report_date: date
    work_component: str
    planned_quantity: Optional[float]
    completed_quantity: Optional[float]
    unit: Optional[str]
    progress_percent: float
    submitted_by: Optional[str]
    verified_by: Optional[str]
    verification_status: str
    evidence_document_id: Optional[str]
    remarks: Optional[str]
    source_record_id: Optional[str]
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Financials ---
class FinancialTransactionCreate(BaseModel):
    project_id: str
    transaction_date: date
    financial_year: str
    transaction_type: str
    amount_released: float = 0.0
    amount_spent: float = 0.0
    bill_amount: float = 0.0
    invoice_reference: Optional[str] = None
    funding_source: Optional[str] = "Central & State Shared (60:40)"
    verification_status: Optional[str] = "Verified"
    source_record_id: Optional[str] = None

class FinancialTransactionOut(BaseModel):
    transaction_id: str
    project_id: str
    transaction_date: date
    financial_year: str
    transaction_type: str
    amount_released: float
    amount_spent: float
    bill_amount: float
    invoice_reference: Optional[str]
    funding_source: str
    verification_status: str
    source_record_id: Optional[str]
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Contracts ---
class ContractCreate(BaseModel):
    project_id: str
    tender_reference: str
    tender_date: Optional[date] = None
    bid_deadline: Optional[date] = None
    awarded_vendor: str
    contract_value: float
    work_order_date: Optional[date] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    variation_order_value: float = 0.0
    contract_status: str = "Active"

class ContractOut(ContractCreate):
    contract_id: str
    source_document_id: Optional[str] = None
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Issues & Risks ---
class IssueRiskCreate(BaseModel):
    project_id: str
    issue_type: str
    description: str
    severity: str = "MEDIUM"
    opened_date: date
    owner_department: Optional[str] = None
    action_due_date: Optional[date] = None
    resolution_status: str = "OPEN"
    recommended_action: Optional[str] = None

class IssueRiskUpdate(BaseModel):
    issue_type: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    owner_department: Optional[str] = None
    action_due_date: Optional[date] = None
    resolution_status: Optional[str] = None
    closure_date: Optional[date] = None
    recommended_action: Optional[str] = None

class IssueRiskOut(IssueRiskCreate):
    issue_id: str
    closure_date: Optional[date] = None
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Inspections ---
class InspectionCreate(BaseModel):
    project_id: str
    inspection_date: date
    inspector_name: str
    observations: str
    quality_score: float = 85.0
    geo_location: Optional[str] = None
    corrective_action: Optional[str] = None
    action_due_date: Optional[date] = None

class InspectionOut(InspectionCreate):
    inspection_id: str
    evidence_document_id: Optional[str] = None
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Documents ---
class DocumentOut(BaseModel):
    document_id: str
    project_id: Optional[str]
    document_type: str
    file_name: str
    storage_uri: str
    source_url: Optional[str]
    issuing_authority: str
    publication_date: Optional[date]
    upload_date: datetime
    version_label: str
    access_level: str
    extraction_confidence: float
    page_or_row_reference: Optional[str]
    is_synthetic: bool

    class Config:
        from_attributes = True

# --- Audit Logs ---
class AuditLogOut(BaseModel):
    audit_id: str
    actor_id: Optional[str]
    actor_name: str
    action: str
    entity_type: str
    entity_id: str
    action_timestamp: datetime
    before_value: Optional[Dict[str, Any]]
    after_value: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

# --- Risk Alert (Explainable Engine) ---
class RiskAlertOut(BaseModel):
    alert_id: str
    project_id: str
    project_name: str
    external_project_id: str
    district: str
    risk_category: str # "Milestone Delay", "Physical-Financial Variance", "Cost Overrun", "Critical Issue", "Stale Progress", "Schedule Extension"
    severity: str # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    triggering_condition: str
    relevant_values: Dict[str, Any]
    source_date: str
    recommended_next_action: str
    review_status: str # "NEEDS_REVIEW", "ACKNOWLEDGED", "RESOLVED"

# --- Dashboard Summary ---
class DashboardSummaryOut(BaseModel):
    total_projects: int
    ongoing_projects: int
    completed_projects: int
    delayed_projects: int
    attention_required_projects: int
    total_approved_budget: float # Exact INR
    total_revised_budget: float
    total_expenditure: float # Exact INR
    overall_physical_progress: float # %
    overall_financial_utilisation: float # %
    budget_baseline_used: str
    last_updated: datetime

# --- AI Assistant / Chat ---
class ChatQueryRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    project_id: Optional[str] = None # Optional context filter

class EvidenceCitation(BaseModel):
    source_title: str
    document_type: str
    date_or_reference: str
    page_or_row: Optional[str] = None
    excerpt: str

class ChatQueryResponse(BaseModel):
    answer: str
    facts: List[str]
    calculated_metrics: Dict[str, Any]
    evidence_citations: List[EvidenceCitation]
    missing_data_warnings: List[str]
    is_demo_mode: bool
    confidence_score: float
