<div align="center">

# 🏛️ Government of Uttar Pradesh
### Department of Tourism & Culture • पर्यटन एवं संस्कृति विभाग
## Project Monitoring & Decision Support System (DSS)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite%20+%20TS-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![SQLite / Postgres](https://img.shields.io/badge/Database-SQLAlchemy%20%7C%20Alembic-blue.svg?style=flat)](https://www.sqlalchemy.org)
[![Security](https://img.shields.io/badge/Security-Multi--Tier%20RBAC%20%26%20Audit-purple.svg?style=flat)](#role-based-access-control-matrix)
[![Dataset](https://img.shields.io/badge/Dataset-10%2C000%2B%20Projects%20CSV-green.svg?style=flat)](#synthetic-dataset-scale)

**Authorized by: Sajal Srivastava, Director General - Tourism**  
*Grounded AI • Zonal Governance • Contractor Measurement Verification • 75 Districts Surveillance*

</div>

---

## 📌 Executive Summary & Problem Statement

The **Department of Tourism & Culture, Government of Uttar Pradesh** manages hundreds of high-value tourism infrastructure, pilgrimage revitalization (PRASHAD), and heritage preservation (Swadesh Darshan 2.0) projects spanning all 75 districts of Uttar Pradesh.

### Core Challenges Addressed:
1. **Physical-Financial Disconnect**: Contractors often draw financial milestones while physical construction lags on ground.
2. **Fragmented Zonal Oversight**: State-level headquarters lack real-time visibility into field-level engineering inspections.
3. **Delayed Contractor Reporting**: Traditional manual Measurement Books (MB) delay anomaly detection by weeks.
4. **Information Silos**: Officers cannot quickly query multi-volume DPRs, tender agreements, and inspection notes.

### Solution:
The **UP Tourism Decision Support System (DSS)** bridges ground reality with executive governance through **deterministic risk algorithms**, **strict multi-tier RBAC**, **vendor-scoped progress submission with official verification**, and **grounded anti-hallucination GenAI**.

---

## 🌟 Key Capabilities & Features

### 1. 🛡️ Multi-Tier Role-Based Access Control (RBAC)
* **Director General (Admin - Sajal Srivastava)**: Statewide governance over all 75 districts. Full master project creation, contractor measurement approval, user & nodal officer provisioning, and statutory reporting.
* **Zonal Nodal Project In-Charge (Field Monitors)**: **Strict District-Level Scope**. A Nodal Officer for *Varanasi Zone* (Er. Alok Srivastava) or *Ayodhya Zone* (Er. Priya Sharma) only sees and monitors projects within their assigned district.
* **Contractor / Executing Vendor**: Scoped strictly to their single awarded contract project (e.g. *Purvanchal Infra JV* for Dashashwamedh Ghat). Vendors submit physical progress updates which enter a mandatory **`Pending Verification`** state.
* **Financial & Statutory Auditor**: Read-only state analytics, financial utilization metrics, and audit export capabilities.

### 2. 🏗️ Project Registry & Contractor Assignment
* Master project registry with direct **Awarded Vendor / Executing Contractor** assignment.
* Visual contractor badges across project dossiers, milestone boards, and inspection trails.
* Admin ability to register new projects and define the awarded contractor agency during inception.

### 3. ⚡ Deterministic Risk & Anomaly Detection Engine
* **Physical-Financial Gap Alert**: Automatically flags projects where Financial Outlay Utilization exceeds Physical Progress by **>15%**.
* **Milestone Overdue Surveillance**: Scans planned vs. actual milestone timelines against statutory SLAs.
* **Budget Variance Indexing**: Tracks administrative approvals against revised sanctions to prevent cost escalation.

### 4. 🤖 Grounded Anti-Hallucination AI Assistant
* Domain-specific LLM assistant with Retrieval-Augmented Generation (RAG).
* Every response is **strictly grounded** with citations to project records, G.O. references, and contractor MB entries.
* Includes explicit missing data warnings and confidence scores.

### 5. 👥 Admin Provisioning Suite
* Admin can provision new **Contractor / Vendor accounts** (binding them to specific project scopes).
* Admin can provision new **Nodal Project Officers** (binding them to specific district jurisdictions).
* Immutable audit trail logging all provisioning actions under Section 43/66 of the IT Act, 2000.

---

## 🔑 Role-Based Access Control Matrix

Pre-configured official credentials for evaluation and testing:

| Role & Designation | Official / Contractor Name | Email | Password | Assigned Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Director General (Admin)** | **Sajal Srivastava** | `admin@uptourism.gov.in` | `Admin@123` | **Statewide (75 Districts)** | Full admin, project creation, vendor provisioning, MB approvals |
| **Nodal In-Charge (Varanasi)** | Er. Alok Srivastava | `officer@uptourism.gov.in` | `Officer@123` | **Varanasi District & Zone** | Field inspections, milestone tracking, Varanasi surveillance |
| **Nodal In-Charge (Ayodhya)** | Er. Priya Sharma | `officer.ayodhya@uptourism.gov.in` | `Officer@123` | **Ayodhya District & Zone** | Field inspections, milestone tracking, Ayodhya surveillance |
| **Contractor (Varanasi)** | Er. Ramesh Verma *(Purvanchal JV)* | `vendor.varanasi@purvanchal.com` | `Vendor@123` | `UPT-VNS-2023-004` (Dashashwamedh) | Progress submission *(Pending Official Verification)* |
| **Contractor (Ayodhya)** | Er. Vikram Seth *(Bridge & Heritage)* | `vendor.ayodhya@heritagebuild.com` | `Vendor@123` | `UPT-AYD-2024-001` (Ram Ki Paidi) | Progress submission *(Pending Official Verification)* |
| **Audit Officer (Viewer)** | Ms. Sunita Verma | `viewer@uptourism.gov.in` | `Viewer@123` | **Statewide (Read-Only)** | Financial audit analytics, statutory dossier exports |

> 💡 **Hackathon 1-Click Login**: On the login screen, switch to the **"1-Click Evaluator Roles"** tab to instantly test any persona without manual typing.

---

## 🚀 Quick Start Guide

### Prerequisites:
* Python 3.10+ (Tested through Python 3.14)
* Node.js 18+ & npm

### 1-Click Single Command Execution:
```bash
python run.py
```
*(On Windows, you can also simply double-click `start.bat`)*

This script automatically:
1. Cleans and releases ports `8000` and `5173`.
2. Starts the **FastAPI Backend** on `http://localhost:8000`.
3. Starts the **React + Vite Frontend** on `http://localhost:5173`.
4. Opens the DSS Login Portal automatically in your default browser.

---

### Manual Step-by-Step Execution:

#### 1. Backend Setup:
```bash
# Navigate to project root
python run_backend.py
# Backend API & Swagger: http://localhost:8000/docs
```

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
# Frontend Dashboard: http://localhost:5173
```

---

## 🌐 System Access Endpoints

| Service | URL | Description |
| :--- | :--- | :--- |
| **Primary Frontend UI** | [http://localhost:5173](http://localhost:5173) | Vite dev server with Hot Module Reload |
| **Backup Direct UI** | [http://localhost:8000](http://localhost:8000) | Production React SPA served directly from FastAPI |
| **Interactive API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for exploring all REST endpoints |
| **Alternative API Specs** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | ReDoc API Reference documentation |

---

## 📊 Synthetic Dataset Scale

* **File Location**: `up_tourism_10k_projects_dataset.csv` & `sample_data/`
* **Scale**: **10,001 rows** of synthetic tourism infrastructure project records.
* **Coverage**: All 75 districts of Uttar Pradesh across Heritage, Pilgrimage, Eco-Tourism, and Cultural infrastructure.
* **Schemas Represented**: Swadesh Darshan 2.0, PRASHAD, State Plan, Chief Minister Tourism Development Scheme.
* **Disclaimers**: All data points are synthetically generated for benchmark evaluation in accordance with synthetic data guidelines.

---

## 🏗️ Architecture & Technology Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                    UP Tourism DSS Portal                     │
   │           (React 18 + Vite + TypeScript + Tailwind)          │
   └───────────────┬───────────────────────────────▲──────────────┘
                   │ HTTPS / REST (JWT Bearer)     │
   ┌───────────────▼───────────────────────────────┴──────────────┐
   │                    FastAPI Backend Engine                    │
   │            (Uvicorn ASGI • Python 3.10+ / 3.14)              │
   ├──────────────────────────────┬───────────────────────────────┤
   │  • Multi-Tier RBAC Guards    │  • Grounded RAG Query Engine  │
   │  • Progress Verification API │  • Rule Risk Calculation      │
   │  • Vendor Provisioning       │  • Audit Trail Logger         │
   └───────────────┬──────────────┴────────────────┬──────────────┘
                   │                               │
   ┌───────────────▼──────────────┐ ┌──────────────▼──────────────┐
   │   SQLite / PostgreSQL DB     │ │    Sentence Transformers    │
   │    (SQLAlchemy ORM 2.0)      │ │   Vector Storage (Chroma)   │
   └──────────────────────────────┘ └─────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST Routers (auth, projects, progress, risks, etc.)
│   │   ├── core/            # Config, Security (JWT/bcrypt), Database session
│   │   ├── models/          # SQLAlchemy Database Models (User, Project, Contract, AuditLog)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Risk calculation engine, RAG pipeline, Ingestion service
│   │   └── seed/            # Pre-configured demo data & initial users
│   ├── tests/               # Pytest automated test suite (6/6 passing)
│   ├── main.py              # FastAPI application factory & SPA static mount
│   └── run.py               # Direct backend launcher
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with automatic JWT bearer interceptor
│   │   ├── components/      # Header (with UP Logo & User profile), Sidebar, Modals
│   │   ├── pages/           # LoginPage, OverviewDashboard, ProjectsPage, ProjectDetailPage, etc.
│   │   └── types/           # TypeScript interfaces (User, Project, Milestone, Risk)
│   ├── public/              # Static assets (Official UP emblem: up_logo.png)
│   └── package.json         # Frontend dependencies and Vite configuration
├── sample_data/             # 10k dataset & sample CSV upload files
├── LOGIN_CREDENTIALS.txt    # Official test logins directory
├── run.py                   # Port-cleaning 1-click launcher for full stack
├── run_backend.py           # Backend entrypoint with sys.path resolution
├── start.bat                # Windows double-click shortcut
└── README.md                # Project documentation
```

---

## 🧪 Test Verification

To run the automated backend test suite:
```bash
python -m pytest backend/tests -v
```
All **6/6 test suites** validate:
* Financial utilization and physical gap calculations
* Overdue milestone triggers and schedule variance alerts
* Ingestion CSV schema and row validation
* JWT token lifecycle and role authentication
* Anti-hallucination grounding and missing data warnings

---

## 🏛️ Government Compliance & Synthetic Data Notice

> **Official Notice**: This application was developed as a Decision Support System (DSS) prototype for the Department of Tourism & Culture, Government of Uttar Pradesh. All project names, vendor entities, contractor figures, financial valuations, and milestone recordings displayed in default evaluation mode are **synthetic demo data** generated for testing purposes. Real administrative approvals, tenders, and Measurement Book verifications are governed by the statutory rules of the Government of Uttar Pradesh.

---

<div align="center">
  <b>Department of Tourism & Culture • Government of Uttar Pradesh</b><br/>
  <i>Empowering Governance Through AI & Transparent Infrastructure Monitoring</i>
</div>
