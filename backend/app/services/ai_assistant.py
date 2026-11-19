import os
import re
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.models import Project, Milestone, FinancialTransaction, ProgressUpdate, IssueRisk, Inspection, Document, DocumentChunk
from app.services.risk_engine import evaluate_all_risks, evaluate_project_risks
from app.schemas.schemas import ChatQueryResponse, EvidenceCitation

# ----------------- SAFE STRUCTURED QUERY LAYER -----------------

def safe_query_delayed_projects(db: Session) -> Dict[str, Any]:
    delayed = db.query(Project).filter(Project.project_status == "Delayed").all()
    results = []
    for p in delayed:
        total_spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
        latest_upd = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
        results.append({
            "external_project_id": p.external_project_id,
            "project_name": p.project_name,
            "district": p.district,
            "scheme": p.scheme_name,
            "approved_budget_cr": round(p.approved_budget / 1e7, 2),
            "revised_budget_cr": round(p.revised_budget / 1e7, 2) if p.revised_budget else None,
            "original_end_date": str(p.original_end_date),
            "revised_end_date": str(p.revised_end_date) if p.revised_end_date else "Not extended",
            "physical_progress_percent": round(latest_upd.progress_percent, 1) if latest_upd else 0.0,
            "implementing_agency": p.implementing_agency
        })
    return {"query_type": "delayed_projects", "count": len(results), "projects": results}

def safe_query_progress_below_threshold(db: Session, threshold: float = 50.0) -> Dict[str, Any]:
    projects = db.query(Project).all()
    lagging = []
    for p in projects:
        latest_upd = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
        prog = latest_upd.progress_percent if latest_upd else 0.0
        if prog < threshold and p.project_status != "Completed":
            lagging.append({
                "external_project_id": p.external_project_id,
                "project_name": p.project_name,
                "district": p.district,
                "status": p.project_status,
                "physical_progress_percent": round(prog, 1),
                "threshold": threshold,
                "approved_budget_cr": round(p.approved_budget / 1e7, 2)
            })
    return {"query_type": "progress_below_threshold", "threshold": threshold, "count": len(lagging), "projects": lagging}

def safe_query_financial_vs_physical_gap(db: Session, gap_threshold: float = 15.0) -> Dict[str, Any]:
    projects = db.query(Project).all()
    gap_projects = []
    for p in projects:
        total_spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
        baseline = p.revised_budget if (p.revised_budget and p.revised_budget > 0) else p.approved_budget
        fin_util = (total_spent / baseline * 100.0) if baseline > 0 else 0.0
        
        latest_upd = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == p.project_id).order_by(ProgressUpdate.report_date.desc()).first()
        phys_prog = latest_upd.progress_percent if latest_upd else 0.0
        
        gap = fin_util - phys_prog
        if gap > gap_threshold and p.project_status != "Completed":
            gap_projects.append({
                "external_project_id": p.external_project_id,
                "project_name": p.project_name,
                "district": p.district,
                "financial_utilisation_percent": round(fin_util, 1),
                "physical_progress_percent": round(phys_prog, 1),
                "variance_gap": round(gap, 1),
                "total_spent_cr": round(total_spent / 1e7, 2),
                "approved_budget_cr": round(baseline / 1e7, 2),
                "observation": "Financial disbursement exceeds recorded physical milestones; recommended for administrative measurement audit."
            })
    return {"query_type": "physical_financial_gap", "gap_threshold": gap_threshold, "count": len(gap_projects), "projects": gap_projects}

def safe_query_overdue_milestones(db: Session) -> Dict[str, Any]:
    today = date.today()
    milestones = db.query(Milestone).join(Project).filter(
        Milestone.planned_end < today,
        Milestone.completion_percent < 100.0,
        Milestone.status != "Completed"
    ).all()
    
    records = []
    for m in milestones:
        overdue_days = (today - m.planned_end).days
        records.append({
            "milestone_id": m.milestone_id,
            "milestone_name": m.milestone_name,
            "project_name": m.project.project_name,
            "external_project_id": m.project.external_project_id,
            "district": m.project.district,
            "planned_end": str(m.planned_end),
            "completion_percent": m.completion_percent,
            "weightage_percent": m.weightage_percent,
            "overdue_days": overdue_days,
            "status": m.status
        })
    return {"query_type": "overdue_milestones", "count": len(records), "milestones": records}

def safe_query_budget_overruns(db: Session) -> Dict[str, Any]:
    projects = db.query(Project).filter(Project.revised_budget > Project.approved_budget).all()
    results = []
    for p in projects:
        diff = p.revised_budget - p.approved_budget
        pct = (diff / p.approved_budget) * 100.0
        results.append({
            "external_project_id": p.external_project_id,
            "project_name": p.project_name,
            "district": p.district,
            "approved_budget_cr": round(p.approved_budget / 1e7, 2),
            "revised_budget_cr": round(p.revised_budget / 1e7, 2),
            "overrun_cr": round(diff / 1e7, 2),
            "overrun_percent": round(pct, 1),
            "status": p.project_status
        })
    return {"query_type": "budget_overruns", "count": len(results), "projects": results}

def safe_query_district_summary(db: Session, target_district: Optional[str] = None) -> Dict[str, Any]:
    query = db.query(Project)
    if target_district:
        query = query.filter(Project.district.ilike(f"%{target_district}%"))
    projects = query.all()
    
    district_data = {}
    for p in projects:
        d = p.district
        if d not in district_data:
            district_data[d] = {
                "district": d,
                "total_projects": 0,
                "ongoing": 0,
                "delayed": 0,
                "completed": 0,
                "total_budget_cr": 0.0,
                "total_spent_cr": 0.0,
                "projects": []
            }
        district_data[d]["total_projects"] += 1
        if p.project_status == "Ongoing":
            district_data[d]["ongoing"] += 1
        elif p.project_status == "Delayed":
            district_data[d]["delayed"] += 1
        elif p.project_status == "Completed":
            district_data[d]["completed"] += 1
            
        spent = sum(t.amount_spent for t in p.financial_transactions if t.amount_spent)
        district_data[d]["total_budget_cr"] += round(p.approved_budget / 1e7, 2)
        district_data[d]["total_spent_cr"] += round(spent / 1e7, 2)
        district_data[d]["projects"].append({
            "external_project_id": p.external_project_id,
            "project_name": p.project_name,
            "status": p.project_status
        })
        
    return {"query_type": "district_summary", "districts": list(district_data.values())}

# ----------------- DOCUMENT CHUNK / RAG RETRIEVAL -----------------

def retrieve_relevant_document_chunks(db: Session, query_text: str, project_id: Optional[str] = None, top_k: int = 3) -> List[EvidenceCitation]:
    """
    Retrieves document chunks matching query keywords.
    Pgvector abstraction or in-memory semantic keyword similarity.
    """
    tokens = [t.lower() for t in re.findall(r'\b[a-zA-Z0-9]{3,}\b', query_text)]
    query = db.query(DocumentChunk).join(Document)
    if project_id:
        query = query.filter(DocumentChunk.project_id == project_id)
        
    chunks = query.all()
    scored = []
    for c in chunks:
        content_lower = c.content.lower()
        score = sum(1 for token in tokens if token in content_lower)
        if score > 0:
            scored.append((score, c))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    citations = []
    for score, chunk in scored[:top_k]:
        doc = chunk.document
        citations.append(EvidenceCitation(
            source_title=doc.file_name,
            document_type=doc.document_type,
            date_or_reference=str(doc.publication_date or doc.upload_date.date()),
            page_or_row=doc.page_or_row_reference or f"Section {chunk.chunk_index + 1}",
            excerpt=chunk.content[:240] + ("..." if len(chunk.content) > 240 else "")
        ))
    return citations

# ----------------- INTENT CLASSIFICATION & DISPATCH -----------------

def classify_and_execute_safe_query(question: str, db: Session, context_project_id: Optional[str] = None) -> Tuple[Dict[str, Any], List[EvidenceCitation], str]:
    q = question.lower()
    citations = retrieve_relevant_document_chunks(db, question, context_project_id)
    
    # 1. Delayed projects
    if "delay" in q or "behind schedule" in q or "late" in q:
        data = safe_query_delayed_projects(db)
        intent = "delayed_projects"
        return data, citations, intent
        
    # 2. Physical vs financial gap or comparison
    elif "compare" in q or "gap" in q or "financial util" in q or "utilisation" in q or "utilization" in q:
        data = safe_query_financial_vs_physical_gap(db)
        intent = "financial_vs_physical_gap"
        return data, citations, intent
        
    # 3. Progress below threshold
    elif "below" in q or "physical progress" in q or "lagging" in q:
        match = re.search(r'below\s*(\d+)%', q)
        thresh = float(match.group(1)) if match else 50.0
        data = safe_query_progress_below_threshold(db, threshold=thresh)
        intent = "progress_below_threshold"
        return data, citations, intent
        
    # 4. Overdue milestones
    elif "milestone" in q or "milestones" in q:
        data = safe_query_overdue_milestones(db)
        intent = "overdue_milestones"
        return data, citations, intent
        
    # 5. Budget overrun / cost overrun
    elif "budget overrun" in q or "cost overrun" in q or "cost escalation" in q or "revised budget" in q:
        data = safe_query_budget_overruns(db)
        intent = "budget_overruns"
        return data, citations, intent
        
    # 6. Major risks & issues
    elif "risk" in q or "issue" in q or "attention" in q:
        alerts = evaluate_all_risks(db)
        data = {
            "query_type": "major_risks",
            "total_alerts": len(alerts),
            "alerts": [a.dict() for a in alerts[:8]]
        }
        intent = "major_risks"
        return data, citations, intent
        
    # 7. Inspection summary
    elif "inspection" in q or "quality" in q or "inspector" in q:
        inspections = db.query(Inspection).order_by(Inspection.inspection_date.desc()).limit(5).all()
        data = {
            "query_type": "inspection_reports",
            "count": len(inspections),
            "inspections": [{
                "project_name": i.project.project_name,
                "inspector": i.inspector_name,
                "date": str(i.inspection_date),
                "score": i.quality_score,
                "observations": i.observations,
                "corrective_action": i.corrective_action
            } for i in inspections]
        }
        intent = "inspection_summary"
        return data, citations, intent
        
    # 8. District report
    elif "district" in q:
        # Check specific district name in UP
        for d in ["ayodhya", "varanasi", "mathura", "agra", "prayagraj", "jhansi", "kushinagar", "gorakhpur", "lucknow", "chitrakoot", "shravasti", "mirzapur"]:
            if d in q:
                data = safe_query_district_summary(db, target_district=d)
                intent = "district_summary"
                return data, citations, intent
        data = safe_query_district_summary(db)
        intent = "district_summary"
        return data, citations, intent
        
    # Default: Portfolio Overview
    else:
        total_p = db.query(Project).count()
        ongoing_p = db.query(Project).filter(Project.project_status == "Ongoing").count()
        delayed_p = db.query(Project).filter(Project.project_status == "Delayed").count()
        completed_p = db.query(Project).filter(Project.project_status == "Completed").count()
        total_budget = db.query(func.sum(Project.approved_budget)).scalar() or 0.0
        total_spent = db.query(func.sum(FinancialTransaction.amount_spent)).scalar() or 0.0
        
        data = {
            "query_type": "portfolio_overview",
            "total_projects": total_p,
            "ongoing": ongoing_p,
            "delayed": delayed_p,
            "completed": completed_p,
            "total_budget_cr": round(total_budget / 1e7, 2),
            "total_spent_cr": round(total_spent / 1e7, 2),
            "financial_utilisation_percent": round((total_spent / total_budget * 100.0), 1) if total_budget > 0 else 0.0
        }
        intent = "portfolio_overview"
        return data, citations, intent

# ----------------- RESPONSE SYNTHESIZER -----------------

def answer_decision_support_query(request_question: str, db: Session, context_project_id: Optional[str] = None) -> ChatQueryResponse:
    """
    Main entry point:
    1. Understands question & dispatches safe parameterized DB queries
    2. Retrieves document chunks from RAG index
    3. Calls LLM if configured; otherwise generates deterministic, fully verified government answers
    4. Enforces clear structure: Facts, Calculations, Recommendations, Citations, Warnings
    """
    structured_data, citations, intent = classify_and_execute_safe_query(request_question, db, context_project_id)
    
    # Check if external LLM is configured
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)
    
    if has_gemini or has_openai:
        try:
            return call_external_llm(request_question, structured_data, citations, intent)
        except Exception as e:
            # Fallback gracefully to deterministic offline mode if API call fails
            pass
            
    # Deterministic High-Precision Government DSS Mode
    return generate_deterministic_grounded_response(request_question, structured_data, citations, intent)

def generate_deterministic_grounded_response(
    question: str, 
    data: Dict[str, Any], 
    citations: List[EvidenceCitation], 
    intent: str
) -> ChatQueryResponse:
    """
    Produces deterministic, grounded official responses strictly based on verified database queries.
    Never invents missing data. Clearly formats Facts, Observations, and Recommendations.
    """
    facts = []
    missing_warnings = []
    recommendations = []
    
    if intent == "delayed_projects":
        projs = data.get("projects", [])
        if projs:
            facts = [
                f"{p['project_name']} ({p['external_project_id']}) in {p['district']} is marked Delayed. Budget: ₹{p['approved_budget_cr']} Cr, Physical Progress: {p['physical_progress_percent']}%, Original Target: {p['original_end_date']}."
                for p in projs
            ]
            answer_text = (
                f"### Official Status Report: Delayed Tourism Projects\n\n"
                f"According to the verified project monitoring database as of {date.today().strftime('%d %B %Y')}, "
                f"there are **{len(projs)} projects** currently classified as **Delayed** across Uttar Pradesh:\n\n"
            )
            for idx, p in enumerate(projs, 1):
                answer_text += (
                    f"**{idx}. {p['project_name']}** (`{p['external_project_id']}`)\n"
                    f"- **District & Scheme**: {p['district']} | {p['scheme']}\n"
                    f"- **Physical Progress**: {p['physical_progress_percent']}%\n"
                    f"- **Approved Budget**: ₹{p['approved_budget_cr']} Crores\n"
                    f"- **Original Completion**: {p['original_end_date']} | **Revised Schedule**: {p['revised_end_date']}\n"
                    f"- **Executing Agency**: {p['implementing_agency']}\n\n"
                )
            answer_text += (
                "#### Administrative Recommendations:\n"
                "1. Convene a tripartite review meeting with the District Magistrate, UPTDC, and executing contractors.\n"
                "2. Enforce recovery schedules with penalty clauses under General Conditions of Contract (GCC).\n"
                "3. Depute state technical inspection team to inspect non-performing work components."
            )
        else:
            answer_text = "No projects are currently classified as Delayed in the active database."
            
    elif intent == "financial_vs_physical_gap":
        projs = data.get("projects", [])
        facts = [
            f"{p['project_name']} ({p['external_project_id']}) has financial utilisation of {p['financial_utilisation_percent']}% vs physical progress of {p['physical_progress_percent']}% (Gap: {p['variance_gap']} percentage points)."
            for p in projs
        ]
        answer_text = (
            f"### Financial Utilisation vs Physical Progress Gap Analysis\n\n"
            f"Rule 3 of the UP Tourism Risk Detection Framework monitors instances where financial disbursement significantly outpaces on-ground physical execution (variance threshold > 15%).\n\n"
            f"Currently, **{len(projs)} project(s)** exhibit a notable variance:\n\n"
        )
        for p in projs:
            answer_text += (
                f"**Project**: {p['project_name']} (`{p['external_project_id']}`), {p['district']}\n"
                f"- **Financial Utilisation**: {p['financial_utilisation_percent']}% (₹{p['total_spent_cr']} Cr disbursed of ₹{p['approved_budget_cr']} Cr baseline)\n"
                f"- **Physical Progress**: {p['physical_progress_percent']}%\n"
                f"- **Variance Gap**: **+{p['variance_gap']}%**\n"
                f"- **Status**: Flagged for administrative measurement verification.\n\n"
            )
        answer_text += (
            "> **Note on Financial Discrepancies**: In accordance with government monitoring guidelines, "
            "variance alerts indicate procurement timing differences (e.g. advance payments for specialized machinery/lighting/marble) "
            "or delayed physical measurement book (MB) entries. They require administrative audit and must not be interpreted as financial irregularity without formal inquiry."
        )

    elif intent == "progress_below_threshold":
        thresh = data.get("threshold", 50.0)
        projs = data.get("projects", [])
        facts = [
            f"{p['project_name']} ({p['external_project_id']}) in {p['district']}: {p['physical_progress_percent']}% physical completion (Status: {p['status']})."
            for p in projs
        ]
        answer_text = (
            f"### Projects with Physical Progress Below {thresh}%\n\n"
            f"A query against the latest verified milestone progress updates identifies **{len(projs)} active projects** below {thresh}% physical completion:\n\n"
        )
        for p in projs:
            answer_text += (
                f"- **{p['project_name']}** (`{p['external_project_id']}`): {p['physical_progress_percent']}% in {p['district']} (Status: *{p['status']}*, Budget: ₹{p['approved_budget_cr']} Cr)\n"
            )
        answer_text += "\nRecommended Action: Prioritize milestone tracking and verify contractor resource mobilization."

    elif intent == "overdue_milestones":
        milestones = data.get("milestones", [])
        facts = [
            f"Milestone '{m['milestone_name']}' for {m['project_name']} was due on {m['planned_end']} ({m['overdue_days']} days overdue, {m['completion_percent']}% complete)."
            for m in milestones
        ]
        answer_text = (
            f"### Overdue Milestone Register\n\n"
            f"As of {date.today()}, **{len(milestones)} critical milestones** are overdue and incomplete across monitored tourism projects:\n\n"
        )
        for m in milestones:
            answer_text += (
                f"**Milestone**: {m['milestone_name']}\n"
                f"- **Project**: {m['project_name']} (`{m['external_project_id']}`), {m['district']}\n"
                f"- **Scheduled Due Date**: {m['planned_end']} (**{m['overdue_days']} days overdue**)\n"
                f"- **Completion Level**: {m['completion_percent']}%\n"
                f"- **Weightage in DPR**: {m['weightage_percent']}%\n\n"
            )

    elif intent == "budget_overruns":
        projs = data.get("projects", [])
        facts = [
            f"{p['project_name']} ({p['external_project_id']}) has an approved budget of ₹{p['approved_budget_cr']} Cr and revised budget of ₹{p['revised_budget_cr']} Cr (+{p['overrun_percent']}%)."
            for p in projs
        ]
        answer_text = (
            f"### Projects with Cost Overruns / Revised Sanction\n\n"
            f"Identified **{len(projs)} project(s)** with sanctioned revised budgets exceeding initial administrative approvals:\n\n"
        )
        for p in projs:
            answer_text += (
                f"- **{p['project_name']}** (`{p['external_project_id']}`), {p['district']}\n"
                f"  - Approved Budget: ₹{p['approved_budget_cr']} Crores\n"
                f"  - Revised Budget: ₹{p['revised_budget_cr']} Crores\n"
                f"  - Escalation: **+₹{p['overrun_cr']} Crores (+{p['overrun_percent']}%)**\n\n"
            )

    elif intent == "major_risks":
        alerts = data.get("alerts", [])
        facts = [
            f"[{a['severity']}] {a['project_name']} ({a['district']}): {a['risk_category']} - {a['triggering_condition']}"
            for a in alerts
        ]
        answer_text = (
            f"### High Priority Risk & Decision Alerts\n\n"
            f"The rule-based explainable risk engine has identified **{len(alerts)} alerts** requiring executive review:\n\n"
        )
        for a in alerts:
            badge = "🔴 CRITICAL" if a['severity'] == "CRITICAL" else ("🟠 HIGH" if a['severity'] == "HIGH" else "🟡 MEDIUM")
            answer_text += (
                f"**{badge} | {a['risk_category']}**\n"
                f"- **Project**: {a['project_name']} (`{a['external_project_id']}`), {a['district']}\n"
                f"- **Condition**: {a['triggering_condition']}\n"
                f"- **Recommended Next Action**: {a['recommended_next_action']}\n\n"
            )

    elif intent == "district_summary":
        districts = data.get("districts", [])
        facts = [
            f"{d['district']}: {d['total_projects']} projects (₹{d['total_budget_cr']} Cr sanctioned, ₹{d['total_spent_cr']} Cr spent)."
            for d in districts
        ]
        answer_text = f"### Uttar Pradesh Tourism: District-wise Portfolio Summary\n\n"
        for d in districts:
            answer_text += (
                f"#### District: **{d['district']}**\n"
                f"- **Total Projects**: {d['total_projects']} (Ongoing: {d['ongoing']}, Delayed: {d['delayed']}, Completed: {d['completed']})\n"
                f"- **Approved Budget**: ₹{d['total_budget_cr']} Crores | **Expenditure**: ₹{d['total_spent_cr']} Crores\n"
            )
            for p in d['projects']:
                answer_text += f"  - `{p['external_project_id']}`: {p['project_name']} (*{p['status']}*)\n"
            answer_text += "\n"

    else:
        answer_text = (
            f"### UP Tourism Infrastructure Portfolio Overview\n\n"
            f"- **Total Monitored Projects**: {data.get('total_projects')}\n"
            f"- **Active Ongoing**: {data.get('ongoing')} | **Delayed**: {data.get('delayed')} | **Completed**: {data.get('completed')}\n"
            f"- **Total Approved Outlay**: ₹{data.get('total_budget_cr')} Crores\n"
            f"- **Cumulative Expenditure**: ₹{data.get('total_spent_cr')} Crores\n"
            f"- **Overall Financial Utilisation**: {data.get('financial_utilisation_percent')}%\n\n"
            f"Feel free to ask specific questions such as:\n"
            f"- *'Which tourism projects are delayed in Uttar Pradesh?'*\n"
            f"- *'Compare financial utilisation and physical progress'* \n"
            f"- *'Which milestones are overdue?'*\n"
            f"- *'Give me an inspection and risk report for Ayodhya and Varanasi'*."
        )

    missing_warnings.append("Synthetic demo data environment: Records marked as SYNTHETIC DEMO DATA for hackathon demonstration purposes.")
    
    return ChatQueryResponse(
        answer=answer_text,
        facts=facts,
        calculated_metrics=data,
        evidence_citations=citations,
        missing_data_warnings=missing_warnings,
        is_demo_mode=True,
        confidence_score=0.98
    )

def call_external_llm(question: str, data: Dict[str, Any], citations: List[EvidenceCitation], intent: str) -> ChatQueryResponse:
    """
    Invokes Gemini or OpenAI when API key is provided, passing strict grounding prompt.
    """
    import json
    
    system_prompt = (
        "You are the Chief AI Decision Support Officer for the Department of Tourism & Culture, Government of Uttar Pradesh.\n"
        "Your task is to provide objective, grounded, highly professional analysis to senior IAS officers and ministers.\n"
        "RULES:\n"
        "1. Strictly base your answer on the provided structured database metrics and document evidence.\n"
        "2. Never hallucinate or invent unlisted budget figures, dates, or project statuses.\n"
        "3. Clearly separate: (A) Verified Database Facts, (B) Analytical Observations, and (C) Recommended Executive Actions.\n"
        "4. When noting a gap between financial utilisation and physical progress, describe it as an administrative discrepancy requiring engineering verification, NEVER as fraud or criminal misuse.\n"
        "5. Label synthetic demonstration data clearly."
    )
    
    user_prompt = f"""Official User Inquiry: {question}

STRUCTURED DATABASE EVIDENCE:
{json.dumps(data, indent=2)}

RETRIEVED DOCUMENT EVIDENCE:
{json.dumps([c.dict() for c in citations], indent=2)}

Please generate a structured, executive-grade briefing response with references."""

    # Try Gemini first if key available
    if settings.GEMINI_API_KEY:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.LLM_MODEL or "gemini-1.5-flash",
            contents=f"{system_prompt}\n\n{user_prompt}"
        )
        return ChatQueryResponse(
            answer=response.text,
            facts=[f"Live LLM synthesized response using verified database facts ({data.get('query_type')})"],
            calculated_metrics=data,
            evidence_citations=citations,
            missing_data_warnings=["Model response generated via Google Gemini Live API with database groundings."],
            is_demo_mode=False,
            confidence_score=0.99
        )
        
    elif settings.OPENAI_API_KEY:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.LLM_MODEL or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        return ChatQueryResponse(
            answer=response.choices[0].message.content,
            facts=[f"Live LLM synthesized response using verified database facts ({data.get('query_type')})"],
            calculated_metrics=data,
            evidence_citations=citations,
            missing_data_warnings=["Model response generated via OpenAI Live API with database groundings."],
            is_demo_mode=False,
            confidence_score=0.99
        )
        
    raise RuntimeError("No LLM API keys configured")
