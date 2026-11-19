import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(255), default="Department of Tourism & Culture, UP")
    designation = Column(String(255), default="Project Officer")
    role = Column(String(50), default="monitor")  # admin, monitor, viewer, vendor
    vendor_company = Column(String(255), nullable=True)
    assigned_project_id = Column(String(100), nullable=True) # external_project_id or project_id
    assigned_district = Column(String(100), nullable=True) # e.g. "Varanasi", "Ayodhya"
    assigned_zone = Column(String(100), nullable=True) # e.g. "Varanasi Zone (Purvanchal)", "Ayodhya Zone"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(String(36), primary_key=True, default=generate_uuid)
    external_project_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. "UPT-AYD-2024-001"
    project_name = Column(String(500), nullable=False, index=True)
    scheme_name = Column(String(255), nullable=False, index=True) # e.g. "Swadesh Darshan 2.0", "PRASHAD", "State Plan"
    district = Column(String(100), nullable=False, index=True) # e.g. "Ayodhya", "Varanasi", "Mathura"
    location_description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True) # Heritage, Pilgrim Amenities, Eco-Tourism, Cultural Infrastructure
    implementing_agency = Column(String(255), nullable=False) # UP Tourism Dev Corp (UPTDC), PWD, Jal Nigam, C&DS
    awarded_vendor = Column(String(255), nullable=True) # Awarded contractor firm / agency
    project_manager = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=False)
    original_end_date = Column(Date, nullable=False)
    revised_end_date = Column(Date, nullable=True)
    project_status = Column(String(50), nullable=False, default="Ongoing", index=True) # Ongoing, Delayed, Completed, Under Review, Tender
    approved_budget = Column(Float, nullable=False) # In INR (Crores or exact rupees; we will store exact rupees)
    revised_budget = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    is_synthetic = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan")
    progress_updates = relationship("ProgressUpdate", back_populates="project", cascade="all, delete-orphan")
    financial_transactions = relationship("FinancialTransaction", back_populates="project", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="project", cascade="all, delete-orphan")
    issues_risks = relationship("IssueRisk", back_populates="project", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"

    milestone_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_name = Column(String(500), nullable=False)
    planned_start = Column(Date, nullable=False)
    planned_end = Column(Date, nullable=False)
    actual_start = Column(Date, nullable=True)
    actual_end = Column(Date, nullable=True)
    weightage_percent = Column(Float, default=0.0)
    completion_percent = Column(Float, default=0.0)
    dependency_milestone_id = Column(String(36), nullable=True)
    status = Column(String(50), default="Pending", index=True) # Pending, In Progress, Completed, Overdue
    remarks = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="milestones")

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    update_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    report_date = Column(Date, nullable=False, index=True)
    work_component = Column(String(255), nullable=False)
    planned_quantity = Column(Float, nullable=True)
    completed_quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True) # sq.m, km, units, %
    progress_percent = Column(Float, nullable=False, default=0.0)
    submitted_by = Column(String(255), nullable=True)
    verified_by = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="Verified", index=True) # Verified, Pending, Rejected
    evidence_document_id = Column(String(36), nullable=True)
    remarks = Column(Text, nullable=True)
    source_record_id = Column(String(100), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="progress_updates")

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    transaction_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    financial_year = Column(String(20), nullable=False, index=True) # e.g. "2024-25"
    transaction_type = Column(String(50), nullable=False) # Release, Expenditure, Bill, Sanction
    amount_released = Column(Float, default=0.0)
    amount_spent = Column(Float, default=0.0)
    bill_amount = Column(Float, default=0.0)
    invoice_reference = Column(String(100), nullable=True)
    funding_source = Column(String(255), default="Central & State Shared (60:40)")
    verification_status = Column(String(50), default="Verified")
    source_record_id = Column(String(100), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="financial_transactions")

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    tender_reference = Column(String(100), nullable=False)
    tender_date = Column(Date, nullable=True)
    bid_deadline = Column(Date, nullable=True)
    awarded_vendor = Column(String(255), nullable=False)
    contract_value = Column(Float, nullable=False)
    work_order_date = Column(Date, nullable=True)
    contract_start_date = Column(Date, nullable=True)
    contract_end_date = Column(Date, nullable=True)
    variation_order_value = Column(Float, default=0.0)
    contract_status = Column(String(50), default="Active") # Active, Completed, Terminated, Under Review
    source_document_id = Column(String(36), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="contracts")

class IssueRisk(Base):
    __tablename__ = "issues_risks"

    issue_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    issue_type = Column(String(100), nullable=False, index=True) # Land Clearance, Material Shortage, Environmental Approval, Contractor Performance, Fund Delay, Right of Way
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, default="MEDIUM", index=True) # HIGH, MEDIUM, LOW, CRITICAL
    opened_date = Column(Date, nullable=False)
    owner_department = Column(String(255), nullable=True)
    action_due_date = Column(Date, nullable=True)
    resolution_status = Column(String(50), default="OPEN", index=True) # OPEN, UNDER_REVIEW, RESOLVED, CLOSED
    closure_date = Column(Date, nullable=True)
    recommended_action = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="issues_risks")

class Inspection(Base):
    __tablename__ = "inspections"

    inspection_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_date = Column(Date, nullable=False, index=True)
    inspector_name = Column(String(255), nullable=False)
    observations = Column(Text, nullable=False)
    quality_score = Column(Float, default=85.0) # 0 to 100
    geo_location = Column(String(100), nullable=True) # Lat, Long
    corrective_action = Column(Text, nullable=True)
    action_due_date = Column(Date, nullable=True)
    evidence_document_id = Column(String(36), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="inspections")

class Document(Base):
    __tablename__ = "documents"

    document_id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=True, index=True)
    document_type = Column(String(100), nullable=False) # DPR, Inspection Report, UC (Utilisation Certificate), Tender, Sanction Order
    file_name = Column(String(255), nullable=False)
    storage_uri = Column(String(500), nullable=False)
    source_url = Column(String(500), nullable=True)
    issuing_authority = Column(String(255), default="UP Tourism Directorate")
    publication_date = Column(Date, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    version_label = Column(String(50), default="v1.0")
    access_level = Column(String(50), default="Confidential - Internal")
    extracted_text = Column(Text, nullable=True)
    extraction_confidence = Column(Float, default=0.95)
    page_or_row_reference = Column(String(100), nullable=True)
    is_synthetic = Column(Boolean, default=True)

    project = relationship("Project", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    chunk_id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.document_id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), nullable=True, index=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    keywords = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)

    document = relationship("Document", back_populates="chunks")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=True)
    actor_name = Column(String(255), default="System")
    action = Column(String(100), nullable=False, index=True) # CREATE_PROJECT, UPDATE_STATUS, VERIFY_PROGRESS, UPLOAD_DATA, etc.
    entity_type = Column(String(100), nullable=False) # Project, Milestone, FinancialTransaction, etc.
    entity_id = Column(String(100), nullable=False)
    action_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    before_value = Column(JSON, nullable=True)
    after_value = Column(JSON, nullable=True)

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    job_id = Column(String(36), primary_key=True, default=generate_uuid)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # csv, xlsx, pdf
    file_path = Column(String(500), nullable=False)
    source_publisher = Column(String(255), nullable=True)
    source_url = Column(String(500), nullable=True)
    publication_date = Column(Date, nullable=True)
    status = Column(String(50), default="PENDING_REVIEW") # PENDING_REVIEW, VALIDATED, COMMITTED, REJECTED
    total_rows = Column(Integer, default=0)
    valid_rows = Column(Integer, default=0)
    invalid_rows = Column(Integer, default=0)
    column_mapping_json = Column(JSON, nullable=True)
    parsed_data_json = Column(JSON, nullable=True)
    validation_report_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(255), default="Authorized Official")
