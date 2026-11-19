import os
import sys
import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.models import Base, Project, Milestone, FinancialTransaction, ProgressUpdate, IssueRisk, User
from app.services.risk_engine import evaluate_project_risks
from app.services.ai_assistant import answer_decision_support_query, classify_and_execute_safe_query
from app.services.ingestion import validate_ingestion_data
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token

# Test in-memory DB
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()

def test_financial_utilisation_and_gap_calculation(db_session):
    """
    Test: Financial utilisation % = Amount spent / selected approved or revised budget * 100
    Test: Gap between financial utilisation and physical progress
    """
    proj = Project(
        external_project_id="TEST-UPT-001",
        project_name="Varanasi Heritage Ghat Restoration",
        scheme_name="PRASHAD",
        district="Varanasi",
        category="Heritage",
        implementing_agency="UPTDC",
        start_date=date(2023, 1, 1),
        original_end_date=date(2024, 12, 31),
        approved_budget=100000000.0, # 10 Cr
        revised_budget=120000000.0, # 12 Cr revised
        project_status="Ongoing",
        is_synthetic=True
    )
    db_session.add(proj)
    db_session.commit()
    db_session.refresh(proj)

    # Add transaction: 9.6 Cr spent
    tx = FinancialTransaction(
        project_id=proj.project_id,
        transaction_date=date(2024, 6, 1),
        financial_year="2024-25",
        transaction_type="Expenditure",
        amount_spent=96000000.0, # 9.6 Cr
        amount_released=100000000.0,
        is_synthetic=True
    )
    # Add verified progress update: 50% physical progress
    upd = ProgressUpdate(
        project_id=proj.project_id,
        report_date=date.today() - timedelta(days=5),
        work_component="Structural Masonry",
        progress_percent=50.0,
        verification_status="Verified",
        is_synthetic=True
    )
    db_session.add_all([tx, upd])
    db_session.commit()

    # Budget baseline calculation: revised budget used when available
    baseline = proj.revised_budget if proj.revised_budget else proj.approved_budget
    total_spent = sum(t.amount_spent for t in proj.financial_transactions)
    fin_util = (total_spent / baseline) * 100.0 # 96M / 120M = 80.0%

    assert fin_util == 80.0
    gap = fin_util - upd.progress_percent # 80.0 - 50.0 = 30.0%
    assert gap == 30.0

    # Risk engine should flag this high gap without accusing of fraud
    alerts = evaluate_project_risks(proj, db_session)
    gap_alerts = [a for a in alerts if a.risk_category == "Physical-Financial Variance"]
    assert len(gap_alerts) == 1
    assert gap_alerts[0].severity == "HIGH"
    assert "exceeds physical progress" in gap_alerts[0].triggering_condition
    assert "Conduct engineering measurement verification" in gap_alerts[0].recommended_next_action

def test_overdue_milestone_detection(db_session):
    """
    Test: Automatically flag milestones that are overdue and incomplete.
    """
    today = date.today()
    proj = Project(
        external_project_id="TEST-UPT-002",
        project_name="Ayodhya Tourist Information Pavilion",
        scheme_name="Swadesh Darshan",
        district="Ayodhya",
        category="Pilgrim Amenities",
        implementing_agency="UP PWD",
        start_date=today - timedelta(days=120),
        original_end_date=today + timedelta(days=120),
        approved_budget=50000000.0,
        project_status="Ongoing",
        is_synthetic=True
    )
    db_session.add(proj)
    db_session.commit()
    db_session.refresh(proj)

    # Milestone 1: completed on time
    m1 = Milestone(
        project_id=proj.project_id,
        milestone_name="Foundation and Soil Stabilization",
        planned_start=today - timedelta(days=120),
        planned_end=today - timedelta(days=60),
        completion_percent=100.0,
        status="Completed",
        is_synthetic=True
    )
    # Milestone 2: overdue (due 15 days ago, only 40% complete)
    m2 = Milestone(
        project_id=proj.project_id,
        milestone_name="Main Canopy Structure & Roof Trusses",
        planned_start=today - timedelta(days=59),
        planned_end=today - timedelta(days=15),
        completion_percent=40.0,
        status="In Progress",
        is_synthetic=True
    )
    db_session.add_all([m1, m2])
    db_session.commit()

    alerts = evaluate_project_risks(proj, db_session)
    ms_alerts = [a for a in alerts if a.risk_category == "Milestone Delay"]
    assert len(ms_alerts) == 1
    assert "overdue by 15 days" in ms_alerts[0].triggering_condition
    assert ms_alerts[0].relevant_values["completion_percent"] == 40.0

def test_budget_variance_and_schedule_extension(db_session):
    """
    Test: Detect revised cost above approved budget and revised completion date later than original.
    """
    proj = Project(
        external_project_id="TEST-UPT-003",
        project_name="Mathura Braj Heritage Corridor",
        scheme_name="Braj Vikas",
        district="Mathura",
        category="Cultural",
        implementing_agency="UPPCL",
        start_date=date(2023, 1, 1),
        original_end_date=date(2024, 6, 30),
        revised_end_date=date(2025, 2, 28),
        approved_budget=40000000.0, # 4 Cr
        revised_budget=50000000.0, # 5 Cr (+25% overrun)
        project_status="Delayed",
        is_synthetic=True
    )
    db_session.add(proj)
    db_session.commit()
    db_session.refresh(proj)

    alerts = evaluate_project_risks(proj, db_session)
    budget_alerts = [a for a in alerts if a.risk_category == "Cost Overrun"]
    ext_alerts = [a for a in alerts if a.risk_category == "Schedule Extension"]
    
    assert len(budget_alerts) == 1
    assert budget_alerts[0].relevant_values["variance_percent"] == 25.0
    assert len(ext_alerts) == 1
    assert ext_alerts[0].relevant_values["extension_days"] > 200

def test_ingestion_data_validation(db_session):
    """
    Test: Upload data validation, duplicate detection, and missing fields.
    """
    proj = Project(
        external_project_id="EXISTING-001",
        project_name="Existing Project",
        scheme_name="State Plan",
        district="Lucknow",
        category="Heritage",
        implementing_agency="UPTDC",
        start_date=date(2024, 1, 1),
        original_end_date=date(2025, 1, 1),
        approved_budget=20000000.0,
        is_synthetic=True
    )
    db_session.add(proj)
    db_session.commit()

    rows = [
        {"ext_id": "EXISTING-001", "name": "Existing Project Updated", "budget": "25000000"},
        {"ext_id": "NEW-002", "name": "Brand New Project", "budget": "18000000"},
        {"ext_id": "NEW-002", "name": "Duplicate Ext ID", "budget": "10000000"}, # Duplicate
        {"ext_id": "", "name": "Missing ID Project", "budget": "5000000"}, # Missing ext_id
        {"ext_id": "NEW-003", "name": "Invalid Budget Project", "budget": "INVALID_TEXT"} # Invalid budget
    ]

    mapping = {
        "ext_id": "external_project_id",
        "name": "project_name",
        "budget": "approved_budget"
    }

    report = validate_ingestion_data(rows, "project", mapping, db_session)
    assert report["total_rows"] == 5
    assert report["valid_count"] == 2 # EXISTING-001 and first NEW-002
    assert report["invalid_count"] == 3
    assert report["duplicate_count"] == 1

def test_authentication_and_tokens():
    """
    Test: Password hashing, verification, and JWT creation/decoding.
    """
    raw_pwd = "GovSecretPassword@2026"
    hashed = get_password_hash(raw_pwd)
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

    token = create_access_token(subject="user-12345", role="admin")
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-12345"
    assert payload["role"] == "admin"

def test_chat_response_grounding_and_fallback(db_session):
    """
    Test: AI assistant executes safe parameterised queries and produces grounded output with citations and warnings.
    """
    # Seed one test delayed project
    proj = Project(
        external_project_id="TEST-DEL-01",
        project_name="Sarnath Museum Soundscape",
        scheme_name="Buddhist Circuit",
        district="Varanasi",
        category="Heritage",
        implementing_agency="UPTDC",
        start_date=date(2023, 1, 1),
        original_end_date=date(2023, 12, 31),
        approved_budget=30000000.0,
        project_status="Delayed",
        is_synthetic=True
    )
    db_session.add(proj)
    db_session.commit()

    response = answer_decision_support_query("Which tourism projects are delayed in Uttar Pradesh?", db_session)
    assert response is not None
    assert response.is_demo_mode is True
    assert "Delayed" in response.answer
    assert "Sarnath Museum Soundscape" in response.answer
    assert len(response.missing_data_warnings) > 0
    assert any("SYNTHETIC DEMO DATA" in w for w in response.missing_data_warnings)
