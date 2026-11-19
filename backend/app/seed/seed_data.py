import os
import uuid
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    User, Project, Milestone, ProgressUpdate, FinancialTransaction,
    Contract, IssueRisk, Inspection, Document, DocumentChunk, AuditLog
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0 and db.query(Project).count() > 0:
        print("Database already contains seed data. Skipping seeding.")
        db.close()
        return

    print("Seeding database with UP Tourism synthetic demo data...")

    # 1. Users
    users_data = [
        {
            "email": "admin@uptourism.gov.in",
            "password": "Admin@123",
            "full_name": "Sajal Srivastava",
            "department": "Directorate of Tourism, Lucknow",
            "designation": "Director General - Tourism",
            "role": "admin"
        },
        {
            "email": "officer@uptourism.gov.in",
            "password": "Officer@123",
            "full_name": "Er. Alok Srivastava",
            "department": "Infrastructure & Project Monitoring Wing",
            "designation": "Executive Engineer / Nodal Project Officer",
            "role": "monitor"
        },
        {
            "email": "viewer@uptourism.gov.in",
            "password": "Viewer@123",
            "full_name": "Ms. Sunita Verma",
            "department": "Finance & Planning Division",
            "designation": "Assistant Director - Financial Audit",
            "role": "viewer"
        },
        {
            "email": "vendor.varanasi@purvanchal.com",
            "password": "Vendor@123",
            "full_name": "Er. Ramesh Verma",
            "department": "Contractor JV Execution Wing",
            "designation": "Project Director (Purvanchal Infra JV)",
            "role": "vendor",
            "vendor_company": "M/s Purvanchal Infrastructure & Heritage Builders JV",
            "assigned_project_id": "UPT-VNS-2023-004"
        },
        {
            "email": "vendor.ayodhya@heritagebuild.com",
            "password": "Vendor@123",
            "full_name": "Er. Vikram Seth",
            "department": "Contractor Civil Wing",
            "designation": "Site In-charge (Bridge & Heritage Corp)",
            "role": "vendor",
            "vendor_company": "UP State Bridge Corporation & UPTDC",
            "assigned_project_id": "UPT-AYD-2024-001"
        }
    ]

    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                department=u["department"],
                designation=u["designation"],
                role=u["role"],
                vendor_company=u.get("vendor_company"),
                assigned_project_id=u.get("assigned_project_id"),
                is_active=True
            )
            db.add(user)
    db.commit()

    # 2. Comprehensive 16 UP Tourism Projects
    projects_info = [
        {
            "ext_id": "UPT-AYD-2024-001",
            "name": "Ram Ki Paidi & Saryu Riverfront Cultural Promenade Phase-2",
            "scheme": "Swadesh Darshan 2.0",
            "district": "Ayodhya",
            "location": "Saryu Riverfront, Naya Ghat to Guptar Ghat",
            "category": "Pilgrim Amenities & Cultural Infrastructure",
            "agency": "UP State Bridge Corporation & UPTDC",
            "manager": "Er. Suresh Chandra",
            "start": date(2024, 1, 15),
            "orig_end": date(2025, 6, 30),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 850000000.0, # 85.0 Cr
            "rev_budget": None,
            "phys_prog": 68.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-VNS-2023-004",
            "name": "Dashashwamedh Heritage Craft Complex & Tourist Facilitation Plaza",
            "scheme": "PRASHAD Scheme",
            "district": "Varanasi",
            "location": "Godowlia-Dashashwamedh Corridor",
            "category": "Heritage Conservation & Craft Hub",
            "agency": "Varanasi Smart City Ltd & C&DS UP Jal Nigam",
            "manager": "Er. R. K. Tripathi",
            "start": date(2023, 6, 1),
            "orig_end": date(2024, 11, 30),
            "revised_end": date(2025, 4, 30),
            "status": "Delayed",
            "budget": 620000000.0, # 62.0 Cr
            "rev_budget": 710000000.0, # 71.0 Cr overrun
            "phys_prog": 54.0,
            "ms_delay": True,
            "gap_scenario": True # Fin util: 82%, Phys: 54% -> Gap: +28%
        },
        {
            "ext_id": "UPT-MTH-2024-002",
            "name": "Govardhan Parikrama Marg Pilgrim Transit Hub & Electric Feeder Depot",
            "scheme": "Integrated Braj Development Scheme",
            "district": "Mathura",
            "location": "Govardhan Parikrama, Anyor",
            "category": "Pilgrim Amenities",
            "agency": "UP Projects Corporation Ltd (UPPCL)",
            "manager": "Er. Deepak Sharma",
            "start": date(2024, 2, 1),
            "orig_end": date(2025, 8, 31),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 480000000.0, # 48.0 Cr
            "rev_budget": None,
            "phys_prog": 42.0,
            "ms_delay": True,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-AGR-2022-009",
            "name": "Tajganj Heritage Walkway & Tourist Orientation Center Phase-1",
            "scheme": "State Tourism Infrastructure Fund",
            "district": "Agra",
            "location": "Taj East Gate Approach",
            "category": "Heritage Walk & Amenities",
            "agency": "Agra Development Authority (ADA)",
            "manager": "Er. Neeraj Saxena",
            "start": date(2022, 10, 1),
            "orig_end": date(2024, 3, 31),
            "revised_end": None,
            "status": "Completed",
            "budget": 350000000.0, # 35.0 Cr
            "rev_budget": 348000000.0,
            "phys_prog": 100.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-PRY-2024-007",
            "name": "Triveni Sangam Digital Immersive Pavilion & Permanent Ghat Steps",
            "scheme": "Maha Kumbh 2025 Mission Scheme",
            "district": "Prayagraj",
            "location": "Sangam Nose & Daraganj Ghat",
            "category": "Spiritual Tourism & Digital Experience",
            "agency": "Prayagraj Mela Pradhikaran & PWD",
            "manager": "Er. Vivek Yadav",
            "start": date(2024, 3, 10),
            "orig_end": date(2024, 12, 15),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 920000000.0, # 92.0 Cr
            "rev_budget": None,
            "phys_prog": 88.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-KSH-2023-011",
            "name": "Mahaparinirvana Temple International Meditation Park & Pilgrim Hostel",
            "scheme": "Buddhist Circuit Infrastructure Mission",
            "district": "Kushinagar",
            "location": "Near Mahaparinirvana Stupa",
            "category": "Buddhist Circuit & Eco-Park",
            "agency": "UP Tourism Development Corporation",
            "manager": "Er. Sanjay Mishra",
            "start": date(2023, 8, 15),
            "orig_end": date(2025, 2, 28),
            "revised_end": date(2025, 7, 31),
            "status": "Ongoing",
            "budget": 530000000.0, # 53.0 Cr
            "rev_budget": None,
            "phys_prog": 61.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-JHS-2023-005",
            "name": "Bundelkhand Heritage Corridor: Rani Laxmibai Fort Sound & Light Hub",
            "scheme": "Swadesh Darshan 2.0",
            "district": "Jhansi",
            "location": "Jhansi Fort Foothills",
            "category": "Historical Heritage & Sound/Light Show",
            "agency": "C&DS UP Jal Nigam",
            "manager": "Er. K. B. Singh",
            "start": date(2023, 4, 1),
            "orig_end": date(2024, 8, 30),
            "revised_end": date(2025, 5, 31),
            "status": "Delayed",
            "budget": 410000000.0, # 41.0 Cr
            "rev_budget": 460000000.0, # cost escalation
            "phys_prog": 48.0,
            "ms_delay": True,
            "gap_scenario": True # Fin util: 74%, Phys: 48% -> Gap: +26%
        },
        {
            "ext_id": "UPT-GKP-2024-008",
            "name": "Ramgarh Taal Water Sports Arena & Eco-Promenade Illumination",
            "scheme": "State Eco-Tourism Initiative",
            "district": "Gorakhpur",
            "location": "Ramgarh Taal Frontage",
            "category": "Eco-Tourism & Recreation",
            "agency": "Gorakhpur Development Authority (GDA)",
            "manager": "Er. Arvind Maurya",
            "start": date(2024, 1, 10),
            "orig_end": date(2025, 5, 15),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 580000000.0, # 58.0 Cr
            "rev_budget": None,
            "phys_prog": 72.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-LKO-2023-014",
            "name": "Kaiserbagh Heritage Palace Zone Restoration & Nawabi Culinary Walk",
            "scheme": "State Cultural Preservation Scheme",
            "district": "Lucknow",
            "location": "Kaiserbagh Complex & Chhatar Manzil precinct",
            "category": "Heritage Conservation",
            "agency": "Archaeology Directorate & PWD",
            "manager": "Er. Farhan Khan",
            "start": date(2023, 9, 1),
            "orig_end": date(2025, 1, 31),
            "revised_end": date(2025, 9, 30),
            "status": "Under Review",
            "budget": 390000000.0, # 39.0 Cr
            "rev_budget": 450000000.0,
            "phys_prog": 38.0,
            "ms_delay": True,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-CKT-2024-006",
            "name": "Chitrakoot Kamadgiri Parikrama Tourist Amenity Zone & Ropeway Shelter",
            "scheme": "Ramayana Circuit Scheme",
            "district": "Chitrakoot",
            "location": "Kamadgiri Parikrama Marg",
            "category": "Pilgrim Amenities",
            "agency": "UP Tourism Development Corporation",
            "manager": "Er. Rameshwar Dayal",
            "start": date(2024, 4, 1),
            "orig_end": date(2025, 10, 31),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 320000000.0, # 32.0 Cr
            "rev_budget": None,
            "phys_prog": 35.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-SHR-2023-012",
            "name": "Jetavana Monastery Pilgrim Rest Complex & Interpretation Center",
            "scheme": "Buddhist Circuit Infrastructure Mission",
            "district": "Shravasti",
            "location": "Jetavana Archeological Park Entrance",
            "category": "Buddhist Circuit",
            "agency": "UP State Construction & Infrastructure Development Corp",
            "manager": "Er. Devendra Nath",
            "start": date(2023, 5, 10),
            "orig_end": date(2024, 9, 30),
            "revised_end": date(2025, 6, 15),
            "status": "Delayed",
            "budget": 290000000.0, # 29.0 Cr
            "rev_budget": None,
            "phys_prog": 45.0,
            "ms_delay": True,
            "gap_scenario": True # Fin util: 71%, Phys: 45% -> Gap: +26%
        },
        {
            "ext_id": "UPT-SRN-2022-003",
            "name": "Sarnath Dhamek Stupa Archeological Illumination & Visitor Facility",
            "scheme": "PRASHAD Scheme",
            "district": "Varanasi",
            "location": "Sarnath Archeological Site",
            "category": "Heritage & Illumination",
            "agency": "UP Tourism Development Corporation",
            "manager": "Er. R. K. Tripathi",
            "start": date(2022, 7, 1),
            "orig_end": date(2023, 12, 31),
            "revised_end": None,
            "status": "Completed",
            "budget": 270000000.0, # 27.0 Cr
            "rev_budget": 268000000.0,
            "phys_prog": 100.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-MZP-2024-010",
            "name": "Maa Vindhyavasini Corridor Phase-2 Visitor Amenities & Parking Complex",
            "scheme": "State Spiritual Tourism Mission",
            "district": "Mirzapur",
            "location": "Vindhyachal Temple Precinct",
            "category": "Pilgrim Amenities",
            "agency": "UP Housing & Development Board (UPAVP)",
            "manager": "Er. Anand Pandey",
            "start": date(2024, 2, 15),
            "orig_end": date(2025, 8, 15),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 740000000.0, # 74.0 Cr
            "rev_budget": None,
            "phys_prog": 58.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-STP-2024-015",
            "name": "Naimisharanya Chakra Tirth Pilgrim Facilitation & Vedic Research Hub",
            "scheme": "State Plan",
            "district": "Sitapur",
            "location": "Chakra Tirth, Naimisharanya",
            "category": "Spiritual & Research Infrastructure",
            "agency": "UP Tourism Development Corporation",
            "manager": "Er. M. P. Singh",
            "start": date(2024, 9, 1),
            "orig_end": date(2026, 3, 31),
            "revised_end": None,
            "status": "Tender",
            "budget": 520000000.0, # 52.0 Cr
            "rev_budget": None,
            "phys_prog": 5.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-BTS-2024-013",
            "name": "Bateshwar 101 Shiva Temples Riverbank Ghat Conservation Circuit",
            "scheme": "Swadesh Darshan 2.0",
            "district": "Agra",
            "location": "Yamuna Riverfront, Bateshwar",
            "category": "Heritage Conservation",
            "agency": "PWD & UP State Bridge Corp",
            "manager": "Er. Neeraj Saxena",
            "start": date(2024, 3, 1),
            "orig_end": date(2025, 9, 30),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 380000000.0, # 38.0 Cr
            "rev_budget": None,
            "phys_prog": 49.0,
            "ms_delay": False,
            "gap_scenario": False
        },
        {
            "ext_id": "UPT-KNJ-2024-016",
            "name": "Kannauj Ittar (Perfume) Tourism Trail & Fragrance Museum Complex",
            "scheme": "ODOP Tourism Synergy Scheme",
            "district": "Kannauj",
            "location": "G.T. Road bypass, Kannauj",
            "category": "Craft & Cultural Experience",
            "agency": "UP Small Industries Corp & UPTDC",
            "manager": "Er. Vinay Agnihotri",
            "start": date(2024, 1, 20),
            "orig_end": date(2025, 7, 20),
            "revised_end": None,
            "status": "Ongoing",
            "budget": 240000000.0, # 24.0 Cr
            "rev_budget": None,
            "phys_prog": 52.0,
            "ms_delay": False,
            "gap_scenario": False
        }
    ]

    project_objs = {}
    for p in projects_info:
        proj = Project(
            external_project_id=p["ext_id"],
            project_name=p["name"],
            scheme_name=p["scheme"],
            district=p["district"],
            location_description=p["location"],
            category=p["category"],
            implementing_agency=p["agency"],
            project_manager=p["manager"],
            start_date=p["start"],
            original_end_date=p["orig_end"],
            revised_end_date=p["revised_end"],
            project_status=p["status"],
            approved_budget=p["budget"],
            revised_budget=p["rev_budget"],
            currency="INR",
            is_synthetic=True
        )
        db.add(proj)
        project_objs[p["ext_id"]] = (proj, p)
    db.commit()

    # 3. Add Milestones, Progress Updates, Financial Transactions, Contracts, Issues, Inspections, and Documents for each project
    today = date.today()

    for ext_id, (proj, meta) in project_objs.items():
        p_id = proj.project_id
        
        # --- Milestones ---
        m1 = Milestone(
            project_id=p_id,
            milestone_name="Site Demarcation, Topographical Survey & Clearance",
            planned_start=meta["start"],
            planned_end=meta["start"] + timedelta(days=60),
            actual_start=meta["start"],
            actual_end=meta["start"] + timedelta(days=55),
            weightage_percent=15.0,
            completion_percent=100.0,
            status="Completed",
            remarks="Completed per survey benchmarks verified by District Revenue Officers.",
            is_synthetic=True
        )
        
        m2_end = meta["start"] + timedelta(days=150)
        m2_status = "Completed" if meta["phys_prog"] >= 50.0 else "In Progress"
        m2_comp = 100.0 if meta["phys_prog"] >= 50.0 else round(meta["phys_prog"] * 1.5, 1)
        m2 = Milestone(
            project_id=p_id,
            milestone_name="Substructure Engineering, Piling & Foundation Works",
            planned_start=meta["start"] + timedelta(days=61),
            planned_end=m2_end,
            actual_start=meta["start"] + timedelta(days=65),
            actual_end=m2_end if m2_status == "Completed" else None,
            weightage_percent=30.0,
            completion_percent=m2_comp,
            status=m2_status,
            remarks="Foundation quality certified via ultrasonic pulse velocity testing.",
            is_synthetic=True
        )
        
        m3_end = meta["start"] + timedelta(days=270)
        # Force overdue condition if requested
        if meta["ms_delay"]:
            m3_end = today - timedelta(days=25)
            m3_status = "Overdue"
            m3_comp = 35.0
        elif meta["phys_prog"] >= 80.0:
            m3_status = "Completed"
            m3_comp = 100.0
        elif meta["phys_prog"] >= 30.0:
            m3_status = "In Progress"
            m3_comp = round(meta["phys_prog"], 1)
        else:
            m3_status = "Pending"
            m3_comp = 0.0
            
        m3 = Milestone(
            project_id=p_id,
            milestone_name="Superstructure Structural Assembly, Civil Enclosure & Stone Cladding",
            planned_start=meta["start"] + timedelta(days=151),
            planned_end=m3_end,
            actual_start=meta["start"] + timedelta(days=160),
            actual_end=m3_end if m3_status == "Completed" else None,
            weightage_percent=35.0,
            completion_percent=m3_comp,
            status=m3_status,
            remarks="Stone masonry using pink Chunar sandstone sourced from authorized quarries." if not meta["ms_delay"] else "Delayed due to labor shortage and stone supply bottleneck.",
            is_synthetic=True
        )

        m4_status = "Completed" if meta["status"] == "Completed" else "Pending"
        m4_comp = 100.0 if meta["status"] == "Completed" else (20.0 if meta["phys_prog"] > 70.0 else 0.0)
        m4 = Milestone(
            project_id=p_id,
            milestone_name="Electrical, MEP, Landscaping & Tourist Signage Commissioning",
            planned_start=meta["start"] + timedelta(days=271),
            planned_end=meta["orig_end"],
            actual_start=meta["start"] + timedelta(days=280) if meta["phys_prog"] > 70 else None,
            actual_end=meta["orig_end"] if meta["status"] == "Completed" else None,
            weightage_percent=20.0,
            completion_percent=m4_comp,
            status=m4_status,
            remarks="Solar lighting array and braille tactile pathways integrated.",
            is_synthetic=True
        )
        db.add_all([m1, m2, m3, m4])

        # --- Contracts ---
        contract_val = meta["budget"] * 0.94
        c1 = Contract(
            project_id=p_id,
            tender_reference=f"e-Tender/UPT/{ext_id[-8:]}/2023-24",
            tender_date=meta["start"] - timedelta(days=90),
            bid_deadline=meta["start"] - timedelta(days=60),
            awarded_vendor=f"M/s Purvanchal Infrastructure & Heritage Builders JV",
            contract_value=contract_val,
            work_order_date=meta["start"] - timedelta(days=20),
            contract_start_date=meta["start"],
            contract_end_date=meta["orig_end"],
            variation_order_value=(meta["rev_budget"] - meta["budget"]) if meta["rev_budget"] else 0.0,
            contract_status="Completed" if meta["status"] == "Completed" else "Active",
            is_synthetic=True
        )
        db.add(c1)

        # --- Financial Transactions ---
        baseline = meta["rev_budget"] if meta["rev_budget"] else meta["budget"]
        if meta["gap_scenario"]:
            # Financial utilisation high (75-82%) while physical progress is ~48-54%
            spent_factor = 0.82 if ext_id == "UPT-VNS-2023-004" else 0.74
            released_factor = 0.88
        elif meta["status"] == "Completed":
            spent_factor = 0.99
            released_factor = 1.0
        else:
            spent_factor = max(0.1, (meta["phys_prog"] / 100.0) * 0.92)
            released_factor = min(1.0, spent_factor + 0.12)

        tot_spent = baseline * spent_factor
        tot_released = baseline * released_factor

        t1 = FinancialTransaction(
            project_id=p_id,
            transaction_date=meta["start"] + timedelta(days=20),
            financial_year="2023-24" if meta["start"].year == 2023 else "2024-25",
            transaction_type="Sanction Release",
            amount_released=round(tot_released * 0.5, 2),
            amount_spent=0.0,
            bill_amount=0.0,
            invoice_reference=f"SANCTION/GO/UPT/{ext_id[-4:]}/R1",
            funding_source="Central:State (60:40) Centrally Sponsored Scheme",
            verification_status="Verified",
            source_record_id=f"PFMS-TX-001-{ext_id[-4:]}",
            is_synthetic=True
        )
        t2 = FinancialTransaction(
            project_id=p_id,
            transaction_date=meta["start"] + timedelta(days=90),
            financial_year="2023-24" if (meta["start"] + timedelta(days=90)).year == 2023 else "2024-25",
            transaction_type="Expenditure Running Bill",
            amount_released=0.0,
            amount_spent=round(tot_spent * 0.55, 2),
            bill_amount=round(tot_spent * 0.55, 2),
            invoice_reference=f"RA-BILL/01/{ext_id[-4:]}",
            funding_source="State Treasury Disbursed",
            verification_status="Verified",
            source_record_id=f"KOSH-UP-BILL-109-{ext_id[-4:]}",
            is_synthetic=True
        )
        t3 = FinancialTransaction(
            project_id=p_id,
            transaction_date=meta["start"] + timedelta(days=180),
            financial_year="2024-25",
            transaction_type="Expenditure Running Bill",
            amount_released=round(tot_released * 0.5, 2),
            amount_spent=round(tot_spent * 0.45, 2),
            bill_amount=round(tot_spent * 0.45, 2),
            invoice_reference=f"RA-BILL/02/{ext_id[-4:]}",
            funding_source="State Treasury Disbursed",
            verification_status="Verified",
            source_record_id=f"KOSH-UP-BILL-204-{ext_id[-4:]}",
            is_synthetic=True
        )
        db.add_all([t1, t2, t3])

        # --- Progress Updates ---
        p_upd1 = ProgressUpdate(
            project_id=p_id,
            report_date=meta["start"] + timedelta(days=90),
            work_component="Substructure & Civil Earthwork",
            planned_quantity=100.0,
            completed_quantity=95.0,
            unit="%",
            progress_percent=round(meta["phys_prog"] * 0.45, 1),
            submitted_by="Site Engineer Alok",
            verified_by="Executive Engineer",
            verification_status="Verified",
            remarks="Earth excavation and base raft slab inspection cleared.",
            is_synthetic=True
        )
        # Recent progress update
        days_ago = 12 if not meta["ms_delay"] else 52 # 52 days ago triggers stale report alert for delayed
        p_upd2 = ProgressUpdate(
            project_id=p_id,
            report_date=today - timedelta(days=days_ago),
            work_component="Superstructure & Stone Carving",
            planned_quantity=100.0,
            completed_quantity=float(meta["phys_prog"]),
            unit="%",
            progress_percent=float(meta["phys_prog"]),
            submitted_by="Site Engineer Alok",
            verified_by="Executive Engineer",
            verification_status="Verified",
            remarks=f"Current progress verified at {meta['phys_prog']}%. MB Record Book Page 48.",
            is_synthetic=True
        )
        db.add_all([p_upd1, p_upd2])

        # --- Inspections ---
        insp = Inspection(
            project_id=p_id,
            inspection_date=today - timedelta(days=20),
            inspector_name="Shri K. K. Sharma (Chief Quality Auditor, PWD UP)",
            observations=f"On-site physical inspection for {proj.project_name} at {proj.district}. Construction material test cubes achieved 94% requisite compressive strength. Safety barriers installed along visitor corridors.",
            quality_score=91.5 if meta["status"] != "Delayed" else 76.0,
            geo_location=f"26.79° N, 82.19° E" if meta["district"] == "Ayodhya" else "25.31° N, 83.00° E",
            corrective_action="Expedite stone dressing labor mobilization and submit fortnightly progress photographs." if meta["status"] == "Delayed" else "Maintain existing curing schedule.",
            action_due_date=today + timedelta(days=15),
            is_synthetic=True
        )
        db.add(insp)

        # --- Issues & Risks ---
        if meta["status"] in ["Delayed", "Under Review"]:
            iss1 = IssueRisk(
                project_id=p_id,
                issue_type="Contractor Labor Shortage & Material Bottleneck",
                description="Shortage of skilled artisans for traditional Chunar red sandstone carving and slow execution by sub-contractor.",
                severity="HIGH",
                opened_date=today - timedelta(days=40),
                owner_department="UP Tourism Infrastructure Directorate",
                action_due_date=today - timedelta(days=10), # overdue issue!
                resolution_status="OPEN",
                recommended_action="Issue 14-day cure notice under GCC Clause 46 and deploy additional artisan shifts.",
                is_synthetic=True
            )
            db.add(iss1)

        # --- Documents & RAG chunks ---
        doc = Document(
            project_id=p_id,
            document_type="Detailed Project Report (DPR)",
            file_name=f"DPR_{ext_id}_Technical_Sanction.pdf",
            storage_uri=f"/storage/documents/DPR_{ext_id}.pdf",
            source_url="https://uptourism.gov.in/tenders/reports/synthetic-demo",
            issuing_authority="Directorate of Tourism, Government of Uttar Pradesh",
            publication_date=meta["start"] - timedelta(days=45),
            version_label="v1.2-Approved",
            access_level="Internal Official",
            extracted_text=(
                f"DETAILED PROJECT REPORT (DPR) FOR {proj.project_name.upper()}.\n"
                f"Project Code: {ext_id}. District: {proj.district}. Sanctioned Cost: INR {proj.approved_budget} under {proj.scheme_name}.\n"
                f"Project Objective: Develop world-class tourism amenities, tourist facilitation center, heritage lighting, and public conveniences.\n"
                f"Scope of Work includes: Foundation piling, RCC framed substructure, ornamental stone claddings, CCTV surveillance grid, EV charging bays, and public toilets.\n"
                f"Scheduled Completion Target: {meta['orig_end']}. Implementing Agency: {proj.implementing_agency}.\n"
                f"Financial Schedule: 40% State Share, 60% Central Component with milestone-based disbursement.\n"
                f"Quality Benchmark: CPWD Specifications 2021 & UP PWD Schedule of Rates (SOR)."
            ),
            extraction_confidence=0.98,
            page_or_row_reference="DPR Section 3.1 - 4.4",
            is_synthetic=True
        )
        db.add(doc)
        db.flush()

        chunk1 = DocumentChunk(
            document_id=doc.document_id,
            project_id=p_id,
            chunk_index=0,
            content=(
                f"Project {ext_id}: {proj.project_name} in {proj.district}. Sanctioned Budget: ₹{proj.approved_budget/1e7:.2f} Cr. "
                f"Objective is to create international standard tourist infrastructure under {proj.scheme_name}. "
                f"Key components: Entrance plaza, pilgrim queuing shelters, interpretation galleries, stone walkway paving."
            ),
            keywords=f"{proj.district} {proj.scheme_name} DPR budget amenities",
            metadata_json={"external_project_id": ext_id, "district": proj.district}
        )
        chunk2 = DocumentChunk(
            document_id=doc.document_id,
            project_id=p_id,
            chunk_index=1,
            content=(
                f"Technical Specifications for {ext_id}: Structural RCC M30 grade, Chunar pink stone veneer 50mm thickness, "
                f"anti-skid tactile flooring for differently-abled visitors, rainwater harvesting pit of 50,000 litres capacity. "
                f"Inspection authority: PWD Technical Audit Wing."
            ),
            keywords=f"{ext_id} specifications stone quality inspection",
            metadata_json={"external_project_id": ext_id, "district": proj.district}
        )
        db.add_all([chunk1, chunk2])

    # 4. Audit Log entry
    audit = AuditLog(
        actor_name="System Initializer",
        action="DATABASE_SEED",
        entity_type="System",
        entity_id="ROOT",
        before_value={},
        after_value={"seeded_projects": len(projects_info), "status": "COMPLETED"}
    )
    db.add(audit)

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
