from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Project, Milestone, ProgressUpdate, FinancialTransaction, IssueRisk, Contract
from app.schemas.schemas import RiskAlertOut

def evaluate_project_risks(project: Project, db: Session, reference_date: date = None) -> List[RiskAlertOut]:
    """
    Evaluates explainable rule-based risks for a single project.
    Strictly factual, non-accusatory, and transparent.
    """
    if reference_date is None:
        reference_date = date.today()

    alerts: List[RiskAlertOut] = []
    
    # 1. Calculate Core Metrics
    total_spent = sum(t.amount_spent for t in project.financial_transactions if t.amount_spent)
    baseline_budget = project.revised_budget if (project.revised_budget and project.revised_budget > 0) else project.approved_budget
    
    financial_utilisation = (total_spent / baseline_budget * 100.0) if baseline_budget > 0 else 0.0
    
    # Physical progress: weighted average of milestones or latest verified progress update
    latest_update = (
        db.query(ProgressUpdate)
        .filter(ProgressUpdate.project_id == project.project_id, ProgressUpdate.verification_status == "Verified")
        .order_by(ProgressUpdate.report_date.desc())
        .first()
    )
    
    # Milestone-based physical progress
    total_milestones = len(project.milestones)
    if total_milestones > 0:
        total_weight = sum(m.weightage_percent for m in project.milestones) or 100.0
        weighted_progress = sum((m.completion_percent * (m.weightage_percent or (100.0 / total_milestones))) / total_weight for m in project.milestones)
        physical_progress = round(weighted_progress, 1)
    elif latest_update:
        physical_progress = round(latest_update.progress_percent, 1)
    else:
        physical_progress = 0.0

    # Rule 1: Overdue milestone
    for m in project.milestones:
        # Check if overdue
        milestone_end = m.planned_end
        if milestone_end < reference_date and m.completion_percent < 100.0 and m.status != "Completed":
            overdue_days = (reference_date - milestone_end).days
            alerts.append(RiskAlertOut(
                alert_id=f"RISK-MS-{m.milestone_id[:8]}",
                project_id=project.project_id,
                project_name=project.project_name,
                external_project_id=project.external_project_id,
                district=project.district,
                risk_category="Milestone Delay",
                severity="HIGH" if overdue_days > 30 else "MEDIUM",
                triggering_condition=f"Milestone '{m.milestone_name}' overdue by {overdue_days} days (completion at {m.completion_percent}%)",
                relevant_values={
                    "milestone_id": m.milestone_id,
                    "milestone_name": m.milestone_name,
                    "planned_end": str(m.planned_end),
                    "completion_percent": m.completion_percent,
                    "overdue_days": overdue_days
                },
                source_date=str(m.planned_end),
                recommended_next_action="Issue formal inquiry to contractor and review revised micro-schedule for milestone recovery.",
                review_status="NEEDS_REVIEW"
            ))

    # Rule 2: Actual progress below planned progress
    # Check linear planned progress vs actual progress if project is ongoing
    if project.project_status == "Ongoing" and project.start_date and project.original_end_date:
        total_days = (project.original_end_date - project.start_date).days
        elapsed_days = (reference_date - project.start_date).days
        if total_days > 0 and elapsed_days > 0:
            expected_linear_progress = min(100.0, (elapsed_days / total_days) * 100.0)
            progress_deficit = expected_linear_progress - physical_progress
            if progress_deficit > 15.0:
                alerts.append(RiskAlertOut(
                    alert_id=f"RISK-PRG-{project.project_id[:8]}",
                    project_id=project.project_id,
                    project_name=project.project_name,
                    external_project_id=project.external_project_id,
                    district=project.district,
                    risk_category="Physical Progress Lag",
                    severity="HIGH" if progress_deficit > 25.0 else "MEDIUM",
                    triggering_condition=f"Physical progress ({physical_progress}%) is {round(progress_deficit, 1)}% behind schedule expectation ({round(expected_linear_progress, 1)}%)",
                    relevant_values={
                        "actual_physical_progress": physical_progress,
                        "expected_progress": round(expected_linear_progress, 1),
                        "deficit": round(progress_deficit, 1)
                    },
                    source_date=str(reference_date),
                    recommended_next_action="Convene joint progress review with implementing agency and depute field engineer for physical audit.",
                    review_status="NEEDS_REVIEW"
                ))

    # Rule 3: Financial utilisation significantly above physical progress
    # Flag for administrative review without accusing of fraud or misuse
    gap = financial_utilisation - physical_progress
    if gap > 15.0 and project.project_status != "Completed":
        alerts.append(RiskAlertOut(
            alert_id=f"RISK-GAP-{project.project_id[:8]}",
            project_id=project.project_id,
            project_name=project.project_name,
            external_project_id=project.external_project_id,
            district=project.district,
            risk_category="Physical-Financial Variance",
            severity="HIGH" if gap > 25.0 else "MEDIUM",
            triggering_condition=f"Financial utilisation ({round(financial_utilisation, 1)}%) exceeds physical progress ({round(physical_progress, 1)}%) by {round(gap, 1)} percentage points.",
            relevant_values={
                "financial_utilisation_percent": round(financial_utilisation, 1),
                "physical_progress_percent": round(physical_progress, 1),
                "variance_gap": round(gap, 1),
                "total_spent_inr": total_spent,
                "approved_budget_inr": baseline_budget
            },
            source_date=str(reference_date),
            recommended_next_action="Conduct engineering measurement verification against billed milestone items prior to disbursing next running bill.",
            review_status="NEEDS_REVIEW"
        ))

    # Rule 4: Revised or forecast cost above approved budget
    if project.revised_budget and project.revised_budget > project.approved_budget:
        cost_overrun = project.revised_budget - project.approved_budget
        overrun_percent = (cost_overrun / project.approved_budget) * 100.0
        alerts.append(RiskAlertOut(
            alert_id=f"RISK-BUD-{project.project_id[:8]}",
            project_id=project.project_id,
            project_name=project.project_name,
            external_project_id=project.external_project_id,
            district=project.district,
            risk_category="Cost Overrun",
            severity="HIGH" if overrun_percent > 10.0 else "MEDIUM",
            triggering_condition=f"Revised budget (₹{project.revised_budget/1e7:.2f} Cr) exceeds approved sanction (₹{project.approved_budget/1e7:.2f} Cr) by ₹{cost_overrun/1e7:.2f} Cr ({round(overrun_percent, 1)}%)",
            relevant_values={
                "approved_budget_cr": round(project.approved_budget / 1e7, 2),
                "revised_budget_cr": round(project.revised_budget / 1e7, 2),
                "variance_cr": round(cost_overrun / 1e7, 2),
                "variance_percent": round(overrun_percent, 1)
            },
            source_date=str(reference_date),
            recommended_next_action="Submit comprehensive Variation Statement to Expenditure Finance Committee (EFC) for administrative sanction.",
            review_status="NEEDS_REVIEW"
        ))

    # Rule 5: High-severity issue overdue
    for issue in project.issues_risks:
        if issue.resolution_status != "CLOSED" and issue.severity in ["HIGH", "CRITICAL"]:
            if issue.action_due_date and issue.action_due_date < reference_date:
                days_overdue = (reference_date - issue.action_due_date).days
                alerts.append(RiskAlertOut(
                    alert_id=f"RISK-ISS-{issue.issue_id[:8]}",
                    project_id=project.project_id,
                    project_name=project.project_name,
                    external_project_id=project.external_project_id,
                    district=project.district,
                    risk_category="Critical Issue Overdue",
                    severity="CRITICAL" if issue.severity == "CRITICAL" else "HIGH",
                    triggering_condition=f"{issue.severity} issue '{issue.issue_type}' unresolved {days_overdue} days past target date ({issue.action_due_date})",
                    relevant_values={
                        "issue_id": issue.issue_id,
                        "issue_type": issue.issue_type,
                        "description": issue.description,
                        "owner_department": issue.owner_department,
                        "action_due_date": str(issue.action_due_date),
                        "days_overdue": days_overdue
                    },
                    source_date=str(issue.opened_date),
                    recommended_next_action=f"Escalate to District Magistrate / Principal Secretary Tourism for inter-departmental resolution: {issue.recommended_action or 'Action pending'}",
                    review_status="NEEDS_REVIEW"
                ))

    # Rule 6: No recent verified progress update (> 45 days)
    if project.project_status == "Ongoing":
        if latest_update:
            days_since_update = (reference_date - latest_update.report_date).days
            if days_since_update > 45:
                alerts.append(RiskAlertOut(
                    alert_id=f"RISK-STL-{project.project_id[:8]}",
                    project_id=project.project_id,
                    project_name=project.project_name,
                    external_project_id=project.external_project_id,
                    district=project.district,
                    risk_category="Stale Progress Reporting",
                    severity="MEDIUM",
                    triggering_condition=f"No verified progress update filed for {days_since_update} days (last update: {latest_update.report_date})",
                    relevant_values={
                        "last_verified_report_date": str(latest_update.report_date),
                        "days_since_report": days_since_update
                    },
                    source_date=str(latest_update.report_date),
                    recommended_next_action="Require nodal project officer and third-party inspection agency to file bi-weekly verification report.",
                    review_status="NEEDS_REVIEW"
                ))
        else:
            alerts.append(RiskAlertOut(
                alert_id=f"RISK-NOUPD-{project.project_id[:8]}",
                project_id=project.project_id,
                project_name=project.project_name,
                external_project_id=project.external_project_id,
                district=project.district,
                risk_category="Missing Progress Baseline",
                severity="MEDIUM",
                triggering_condition="Project has no verified progress reports on file since inception.",
                relevant_values={"project_id": project.project_id},
                source_date=str(project.start_date),
                recommended_next_action="Mandate initial baseline inspection report and upload verified progress measurement.",
                review_status="NEEDS_REVIEW"
            ))

    # Rule 7: Revised completion date later than original completion date
    if project.revised_end_date and project.revised_end_date > project.original_end_date:
        delay_days = (project.revised_end_date - project.original_end_date).days
        alerts.append(RiskAlertOut(
            alert_id=f"RISK-EXT-{project.project_id[:8]}",
            project_id=project.project_id,
            project_name=project.project_name,
            external_project_id=project.external_project_id,
            district=project.district,
            risk_category="Schedule Extension",
            severity="HIGH" if delay_days > 90 else "MEDIUM",
            triggering_condition=f"Project timeline extended by {delay_days} days (Original: {project.original_end_date}, Revised: {project.revised_end_date})",
            relevant_values={
                "original_end_date": str(project.original_end_date),
                "revised_end_date": str(project.revised_end_date),
                "extension_days": delay_days
            },
            source_date=str(project.revised_end_date),
            recommended_next_action="Review Liquidated Damages clause and assess impact on tourist season readiness.",
            review_status="NEEDS_REVIEW"
        ))

    return alerts

def evaluate_all_risks(db: Session, reference_date: date = None) -> List[RiskAlertOut]:
    """
    Evaluates explainable risks for all active projects in the system.
    """
    projects = db.query(Project).all()
    all_alerts = []
    for project in projects:
        alerts = evaluate_project_risks(project, db, reference_date)
        all_alerts.extend(alerts)
    
    # Sort alerts by severity
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_alerts.sort(key=lambda x: severity_order.get(x.severity, 4))
    return all_alerts
