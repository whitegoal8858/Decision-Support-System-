export interface User {
  user_id: string;
  email: string;
  full_name: string;
  department: string;
  designation: string;
  role: 'admin' | 'monitor' | 'viewer' | 'vendor';
  vendor_company?: string;
  assigned_project_id?: string;
  assigned_district?: string;
  assigned_zone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Project {
  project_id: string;
  external_project_id: string;
  project_name: string;
  scheme_name: string;
  district: string;
  location_description?: string;
  category: string;
  implementing_agency: string;
  awarded_vendor?: string;
  project_manager?: string;
  start_date: string;
  original_end_date: string;
  revised_end_date?: string;
  project_status: 'Ongoing' | 'Delayed' | 'Completed' | 'Under Review' | 'Tender';
  approved_budget: number;
  revised_budget?: number;
  currency: string;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  total_spent?: number;
  total_released?: number;
  financial_utilisation_percent?: number;
  physical_progress_percent?: number;
  physical_financial_gap?: number;
  budget_variance?: number;
  overdue_milestones_count?: number;
  open_risks_count?: number;
}

export interface Milestone {
  milestone_id: string;
  project_id: string;
  milestone_name: string;
  planned_start: string;
  planned_end: string;
  actual_start?: string;
  actual_end?: string;
  weightage_percent: number;
  completion_percent: number;
  dependency_milestone_id?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  remarks?: string;
  is_overdue?: boolean;
  is_synthetic: boolean;
}

export interface ProgressUpdate {
  update_id: string;
  project_id: string;
  report_date: string;
  work_component: string;
  planned_quantity?: number;
  completed_quantity?: number;
  unit?: string;
  progress_percent: number;
  submitted_by?: string;
  verified_by?: string;
  verification_status: 'Verified' | 'Pending' | 'Rejected';
  evidence_document_id?: string;
  remarks?: string;
  source_record_id?: string;
  is_synthetic: boolean;
}

export interface FinancialTransaction {
  transaction_id: string;
  project_id: string;
  transaction_date: string;
  financial_year: string;
  transaction_type: string;
  amount_released: number;
  amount_spent: number;
  bill_amount: number;
  invoice_reference?: string;
  funding_source: string;
  verification_status: string;
  source_record_id?: string;
  is_synthetic: boolean;
}

export interface Contract {
  contract_id: string;
  project_id: string;
  tender_reference: string;
  tender_date?: string;
  bid_deadline?: string;
  awarded_vendor: string;
  contract_value: number;
  work_order_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  variation_order_value: number;
  contract_status: string;
  source_document_id?: string;
  is_synthetic: boolean;
}

export interface IssueRisk {
  issue_id: string;
  project_id: string;
  issue_type: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  opened_date: string;
  owner_department?: string;
  action_due_date?: string;
  resolution_status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  closure_date?: string;
  recommended_action?: string;
  is_synthetic: boolean;
}

export interface Inspection {
  inspection_id: string;
  project_id: string;
  inspection_date: string;
  inspector_name: string;
  observations: string;
  quality_score: number;
  geo_location?: string;
  corrective_action?: string;
  action_due_date?: string;
  evidence_document_id?: string;
  is_synthetic: boolean;
}

export interface DocumentRecord {
  document_id: string;
  project_id?: string;
  document_type: string;
  file_name: string;
  storage_uri: string;
  source_url?: string;
  issuing_authority: string;
  publication_date?: string;
  upload_date: string;
  version_label: string;
  access_level: string;
  extraction_confidence: number;
  page_or_row_reference?: string;
  is_synthetic: boolean;
}

export interface RiskAlert {
  alert_id: string;
  project_id: string;
  project_name: string;
  external_project_id: string;
  district: string;
  risk_category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggering_condition: string;
  relevant_values: Record<string, any>;
  source_date: string;
  recommended_next_action: string;
  review_status: string;
}

export interface DashboardSummary {
  total_projects: number;
  ongoing_projects: number;
  completed_projects: number;
  delayed_projects: number;
  attention_required_projects: number;
  total_approved_budget: number;
  total_revised_budget: number;
  total_expenditure: number;
  overall_physical_progress: number;
  overall_financial_utilisation: number;
  budget_baseline_used: string;
  last_updated: string;
}

export interface EvidenceCitation {
  source_title: string;
  document_type: string;
  date_or_reference: string;
  page_or_row?: string;
  excerpt: string;
}

export interface ChatResponse {
  answer: string;
  facts: string[];
  calculated_metrics: Record<string, any>;
  evidence_citations: EvidenceCitation[];
  missing_data_warnings: string[];
  is_demo_mode: boolean;
  confidence_score: number;
}
