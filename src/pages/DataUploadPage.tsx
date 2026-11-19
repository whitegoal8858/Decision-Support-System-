import React, { useState } from 'react';
import { 
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  ArrowRight, ShieldCheck, RefreshCw, Info, Database, Eye
} from 'lucide-react';
import { api } from '../api/client';

export const DataUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetEntity, setTargetEntity] = useState<'project' | 'financial' | 'milestone'>('project');
  const [publisher, setPublisher] = useState<string>('Directorate of Tourism, Lucknow');
  const [sourceUrl, setSourceUrl] = useState<string>('https://uptourism.gov.in/tenders/reports');
  
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [committing, setCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setCommitResult(null);
      setErrorMsg(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_entity', targetEntity);
    formData.append('source_publisher', publisher);
    if (sourceUrl) formData.append('source_url', sourceUrl);

    try {
      const res = await api.uploadFile(formData);
      setUploadResult(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Upload or parsing failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!uploadResult?.job_id) return;

    setCommitting(true);
    setErrorMsg(null);

    try {
      const res = await api.commitUpload(uploadResult.job_id);
      setCommitResult(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to commit data.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Data Ingestion & Reconciliation Pipeline
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Human Confirmation Required
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV, Excel, or PDF documents with multi-stage verification before database commit
          </p>
        </div>
      </div>

      {/* Upload Flow Stepper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-semibold">
          <div className="flex items-center gap-2 text-gov-navy">
            <span className="w-6 h-6 rounded-full bg-gov-navy text-white flex items-center justify-center text-xs">1</span>
            <span>Upload & Extract</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${uploadResult ? 'text-gov-navy' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${uploadResult ? 'bg-gov-navy text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Schema & Mapping Validation</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <div className={`flex items-center gap-2 ${commitResult ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${commitResult ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Human Approval & DB Commit</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Step 1: Upload Form */}
      {!uploadResult && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <form onSubmit={handleUploadSubmit} className="space-y-4 max-w-xl mx-auto text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Target Entity Classification *</label>
              <select
                value={targetEntity}
                onChange={(e: any) => setTargetEntity(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-700"
              >
                <option value="project">Project Master Records (DPR / Sanctions)</option>
                <option value="financial">Financial Transactions & Running Account Bills</option>
                <option value="milestone">Milestone Target Schedules</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Publishing Authority / Division *</label>
              <input
                type="text"
                required
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Source URL / Publication Reference</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="font-semibold text-gov-navy hover:underline text-xs">Click to browse file</span>
                <span className="text-slate-500 text-xs"> or drag and drop</span>
                <input
                  type="file"
                  required
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports CSV, Excel (.xlsx, .xls), or text/table PDF documents up to 50MB
              </p>
              {selectedFile && (
                <div className="mt-3 p-2 rounded bg-white border border-slate-200 inline-flex items-center gap-2 font-mono text-xs font-semibold text-slate-800">
                  <FileSpreadsheet className="w-4 h-4 text-gov-navy" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-3 bg-gov-navy hover:bg-gov-navyLight text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Extracting Tables & Parsing Schema...
                </>
              ) : (
                'Proceed to Schema Validation & Extraction Preview'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Validation Report & Preview */}
      {uploadResult && !commitResult && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gov-navy font-mono">Job ID: {uploadResult.job_id}</div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Validation Report: {uploadResult.file_name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Rows Extracted: {uploadResult.total_rows} • Target: {uploadResult.target_entity}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => { setUploadResult(null); setSelectedFile(null); }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Upload Different File
              </button>

              <button
                onClick={handleCommit}
                disabled={committing || uploadResult.validation_report.valid_count === 0}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {committing ? 'Committing to Database...' : 'Confirm & Commit Validated Rows'}
              </button>
            </div>
          </div>

          {/* Validation Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-emerald-700 font-medium">Valid Clean Rows</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {uploadResult.validation_report.valid_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Ready for insertion/update</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
              <div className="text-red-700 font-medium">Invalid / Missing Value Rows</div>
              <div className="text-2xl font-bold text-red-700 mt-1">
                {uploadResult.validation_report.invalid_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Rejected due to validation rules</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-amber-700 font-medium">Duplicate Records Detected</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {uploadResult.validation_report.duplicate_count}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Internal collision warnings</div>
            </div>
          </div>

          {/* Duplicate Warnings */}
          {uploadResult.validation_report.duplicate_warnings?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Duplicate Key Warnings:
              </div>
              {uploadResult.validation_report.duplicate_warnings.map((w: string, i: number) => (
                <div key={i}>• {w}</div>
              ))}
            </div>
          )}

          {/* Invalid Rows Details */}
          {uploadResult.validation_report.invalid_rows_detail?.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-red-200 shadow-xs">
              <h3 className="text-xs font-bold text-red-900 mb-2">Invalid Rows Analysis & Rejection Reasons:</h3>
              <div className="space-y-2">
                {uploadResult.validation_report.invalid_rows_detail.map((inv: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-red-50/50 border border-red-100 text-xs">
                    <span className="font-bold text-red-800">Row {inv.row_number}:</span>{' '}
                    <span className="text-red-700">{inv.errors.join('; ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 mb-3">Sample Validated Rows Preview:</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">External Project ID</th>
                    <th className="py-2.5 px-3">Mapped Name / Ref</th>
                    <th className="py-2.5 px-3">Action Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {uploadResult.validation_report.sample_valid?.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-mono text-slate-400">#{row._row_number}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-gov-navy">{row.external_project_id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{row.project_name || row.transaction_type || '--'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {row._action_type || 'INSERT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {commitResult && (
        <div className="bg-white p-8 rounded-xl border border-emerald-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Data Ingestion Successfully Committed</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {commitResult.message}
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700 border border-slate-200 text-left">
            <div><b>Job ID:</b> {commitResult.job_id}</div>
            <div><b>Records Created:</b> {commitResult.created_records}</div>
            <div><b>Records Updated:</b> {commitResult.updated_records}</div>
            <div><b>Audit Trail Logged:</b> Yes (COMMIT_DATA_INGESTION)</div>
          </div>
          <button
            onClick={() => { setCommitResult(null); setUploadResult(null); setSelectedFile(null); }}
            className="px-4 py-2 bg-gov-navy text-white rounded-lg text-xs font-semibold hover:bg-gov-navyLight"
          >
            Upload Another Dataset
          </button>
        </div>
      )}
    </div>
  );
};
