import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Building, Calendar, MapPin, IndianRupee, 
  Activity, AlertTriangle, FileText, CheckCircle2, Clock, 
  ShieldAlert, UserCheck, Plus, ExternalLink, Edit3
} from 'lucide-react';
import { api } from '../api/client';
import { Project, Milestone, FinancialTransaction, ProgressUpdate, IssueRisk, Inspection, Contract, DocumentRecord, User } from '../types';

interface ProjectDetailPageProps {
  projectId: string;
  onBack: () => void;
  onAskAIAboutProject: (projectName: string) => void;
  currentUser?: User | null;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ 
  projectId, 
  onBack,
  onAskAIAboutProject,
  currentUser
}) => {
  const [details, setDetails] = useState<{
    project: Project;
    milestones: Milestone[];
    financial_transactions: FinancialTransaction[];
    progress_updates: ProgressUpdate[];
    contracts: Contract[];
    issues_risks: IssueRisk[];
    inspections: Inspection[];
    documents: DocumentRecord[];
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'milestones' | 'financials' | 'progress' | 'risks' | 'inspections' | 'contracts' | 'documents'>('milestones');
  const [loading, setLoading] = useState<boolean>(true);

  // New Progress Update modal state
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [progForm, setProgForm] = useState({
    work_component: 'Superstructure Civil Work',
    progress_percent: 65,
    remarks: 'Field inspection completed. Construction meets technical specifications.'
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getProjectDetails(projectId);
      setDetails(data);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [projectId]);

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitProgress({
        project_id: details?.project.project_id,
        report_date: new Date().toISOString().split('T')[0],
        work_component: progForm.work_component,
        progress_percent: Number(progForm.progress_percent),
        remarks: progForm.remarks
      });
      setShowProgressModal(false);
      fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyProgress = async (updateId: string) => {
    try {
      await api.verifyProgress(updateId);
      fetchDetails();
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  if (loading || !details) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
        Loading project dossier...
      </div>
    );
  }

  const { project, milestones, financial_transactions, progress_updates, contracts, issues_risks, inspections, documents } = details;
  const isGap = (project.physical_financial_gap || 0) > 15 && project.project_status !== 'Completed';

  return (
    <div className="space-y-6">
      {/* Back Button & Top Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-gov-navy transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Project Registry
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAskAIAboutProject(project.project_name)}
            className="inline-flex items-center text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-xs"
          >
            Ask AI Assistant About This Project
          </button>
        </div>
      </div>

      {/* Hero Dossier Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-gov-navy border border-slate-200">
                {project.external_project_id}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                project.project_status === 'Delayed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : project.project_status === 'Completed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {project.project_status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Internal UUID: {project.project_id.slice(0, 8)}...
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1.5">
              {project.project_name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><b>District:</b> {project.district}</span>
              <span><b>Scheme:</b> {project.scheme_name}</span>
              <span><b>Executing Agency:</b> {project.implementing_agency}</span>
              <span><b>Awarded Contractor:</b> <span className="font-semibold text-purple-700">{project.awarded_vendor || contracts?.[0]?.awarded_vendor || 'Tender In Progress'}</span></span>
              <span><b>Nodal Officer:</b> {project.project_manager || 'Not Assigned'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Approved DPR Outlay</div>
              <div className="text-xl font-bold text-slate-900">₹{(project.approved_budget / 1e7).toFixed(2)} Cr</div>
              {project.revised_budget && (
                <div className="text-[11px] text-amber-600 font-semibold">
                  Revised Sanction: ₹{(project.revised_budget / 1e7).toFixed(2)} Cr
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Highlight Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-slate-500 font-medium">Physical Progress</div>
            <div className="text-lg font-bold text-emerald-700 mt-0.5">{project.physical_progress_percent || 0}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${project.physical_progress_percent || 0}%` }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-slate-500 font-medium">Financial Utilisation</div>
            <div className={`text-lg font-bold mt-0.5 ${isGap ? 'text-amber-600' : 'text-gov-navy'}`}>
              {project.financial_utilisation_percent || 0}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Spent ₹{((project.total_spent || 0) / 1e7).toFixed(2)} Cr
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-slate-500 font-medium">Physical-Financial Gap</div>
            <div className={`text-lg font-bold mt-0.5 ${isGap ? 'text-amber-600' : 'text-slate-700'}`}>
              {(project.physical_financial_gap || 0) > 0 ? `+${project.physical_financial_gap}%` : `${project.physical_financial_gap}%`}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {isGap ? 'Flagged for measurement review' : 'Within normal variance'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-slate-500 font-medium">Target Schedule</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{project.original_end_date}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              {project.revised_end_date ? `Revised: ${project.revised_end_date}` : 'On original schedule'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'milestones' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Milestones ({milestones.length})
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'financials' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <IndianRupee className="w-4 h-4" />
            Financial Transactions ({financial_transactions.length})
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'progress' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Progress Updates ({progress_updates.length})
          </button>

          <button
            onClick={() => setActiveTab('risks')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'risks' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Issues & Risks ({issues_risks.length})
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'inspections' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Field Inspections ({inspections.length})
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'contracts' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            Contracts & Tenders ({contracts.length})
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3.5 px-5 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'documents' ? 'border-gov-navy text-gov-navy bg-slate-50/50' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documents & DPR ({documents.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6">
          {/* 1. Milestones */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Milestone Schedule Breakdown</h3>
                <span className="text-xs text-slate-500">Weightage-based physical progress accounting</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Milestone Name</th>
                      <th className="py-2.5 px-3">Planned Schedule</th>
                      <th className="py-2.5 px-3">Actual / Revised</th>
                      <th className="py-2.5 px-3 text-center">Weight %</th>
                      <th className="py-2.5 px-3 text-center">Completion %</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {milestones.map((m) => (
                      <tr key={m.milestone_id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-medium text-slate-900">{m.milestone_name}</td>
                        <td className="py-3 px-3 text-slate-600">{m.planned_start} to {m.planned_end}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {m.actual_start ? `${m.actual_start} to ${m.actual_end || 'In progress'}` : '--'}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">{m.weightage_percent}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold">{m.completion_percent}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                            <div className="bg-gov-navy h-full rounded-full" style={{ width: `${m.completion_percent}%` }} />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.status === 'Overdue'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : m.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs">{m.remarks || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Financials */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Financial Ledger & Disbursement History</h3>
                  <p className="text-xs text-slate-500">All sanction releases, invoices, and running account bills</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Financial Year</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Invoice / Sanction Ref</th>
                      <th className="py-2.5 px-3 text-right">Released (INR)</th>
                      <th className="py-2.5 px-3 text-right">Spent / Billed (INR)</th>
                      <th className="py-2.5 px-3">Funding Source</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financial_transactions.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium">{tx.transaction_date}</td>
                        <td className="py-2.5 px-3">{tx.financial_year}</td>
                        <td className="py-2.5 px-3 font-medium">{tx.transaction_type}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{tx.invoice_reference || '--'}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                          {tx.amount_released ? `₹${(tx.amount_released / 1e7).toFixed(2)} Cr` : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-gov-navy">
                          {tx.amount_spent ? `₹${(tx.amount_spent / 1e7).toFixed(2)} Cr` : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{tx.funding_source}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {tx.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Progress Updates */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Progress Verification Log</h3>
                  <p className="text-xs text-slate-500">Measurement book entries and verified field reports</p>
                </div>
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gov-navy text-white hover:bg-gov-navyLight shadow-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {currentUser?.role === 'vendor' ? 'Submit Contractor Progress' : 'Submit Progress Verification'}
                </button>
              </div>

              <div className="space-y-3">
                {progress_updates.map((upd) => (
                  <div key={upd.update_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{upd.work_component}</span>
                        {upd.verification_status === 'Pending' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Pending Official Verification
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {upd.verification_status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{upd.remarks}</p>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Reported on {upd.report_date} by {upd.submitted_by || 'Field Engineer'} {upd.verified_by ? `• Verified by ${upd.verified_by}` : '• Verification Awaited'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Department Admin / Monitor Verification Action */}
                      {upd.verification_status === 'Pending' && currentUser?.role in { admin: 1, monitor: 1 } && (
                        <button
                          onClick={() => handleVerifyProgress(upd.update_id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve & Verify
                        </button>
                      )}

                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-slate-900">{upd.progress_percent}%</div>
                        <div className="text-[10px] text-slate-500">Recorded Progress</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Risks & Issues */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Recorded Issues & Environmental Bottlenecks</h3>
              <div className="space-y-3">
                {issues_risks.length === 0 ? (
                  <p className="text-xs text-slate-400">No active unresolved issues recorded for this project.</p>
                ) : (
                  issues_risks.map((iss) => (
                    <div key={iss.issue_id} className="p-4 rounded-xl border border-red-200 bg-red-50/30">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-red-900">{iss.issue_type}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          {iss.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5">{iss.description}</p>
                      <div className="mt-2 text-xs font-semibold text-slate-900 bg-white p-2 rounded border border-red-100">
                        Recommended Action: <span className="font-normal text-slate-600">{iss.recommended_action}</span>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Target Due Date: {iss.action_due_date || 'Immediate'}</span>
                        <span className="font-medium">Status: {iss.resolution_status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 5. Inspections */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Third-Party & Directorate Field Quality Audits</h3>
              <div className="space-y-3">
                {inspections.map((insp) => (
                  <div key={insp.inspection_id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{insp.inspector_name}</div>
                      <div className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-gov-navy border border-blue-200">
                        Quality Score: {insp.quality_score} / 100
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{insp.observations}</p>
                    <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                      <span>Inspection Date: {insp.inspection_date}</span>
                      <span>Geo Location: {insp.geo_location || 'Coordinates Logged'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Contracts */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Executed Contracts & Vendor Agreements</h3>
              {contracts.map((c) => (
                <div key={c.contract_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gov-navy">{c.tender_reference}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.contract_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><b>Awarded Vendor:</b> {c.awarded_vendor}</div>
                    <div><b>Contract Value:</b> ₹{(c.contract_value / 1e7).toFixed(2)} Cr</div>
                    <div><b>Work Order Date:</b> {c.work_order_date || '--'}</div>
                    <div><b>Variation Orders:</b> ₹{(c.variation_order_value / 1e7).toFixed(2)} Cr</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 7. Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Project Documents & RAG Indexed Artifacts</h3>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-gov-navy shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">{doc.file_name}</div>
                        <div className="text-[11px] text-slate-500">{doc.document_type} • Uploaded {doc.upload_date?.slice(0, 10)} • {doc.version_label}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Conf: {(doc.extraction_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Verification Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">Submit Verified Progress Measurement</h2>
            <p className="text-xs text-slate-500 mb-4">Record verified measurement book entry for {project.external_project_id}</p>

            <form onSubmit={handleProgressSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Work Component *</label>
                <input
                  type="text"
                  required
                  value={progForm.work_component}
                  onChange={(e) => setProgForm({ ...progForm, work_component: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Verified Physical Completion % (0-100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={progForm.progress_percent}
                  onChange={(e) => setProgForm({ ...progForm, progress_percent: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Technical Observation Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={progForm.remarks}
                  onChange={(e) => setProgForm({ ...progForm, remarks: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy text-white rounded-lg hover:bg-gov-navyLight font-semibold"
                >
                  Record Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
