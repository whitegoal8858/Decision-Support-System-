import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, CheckCircle2, Eye, ExternalLink, Shield } from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getDocuments();
        setDocuments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInspectDoc = async (docId: string) => {
    try {
      const details = await api.getDocumentDetails(docId);
      setSelectedDoc(details);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = documents.filter(d => {
    if (selectedType && d.document_type !== selectedType) return false;
    if (!search) return true;
    return d.file_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Documents & RAG Knowledge Repository
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Vector & Full-Text Indexed
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of DPRs, technical sanction orders, utilisation certificates, and inspection notes
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title, project, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-navy bg-white"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700"
        >
          <option value="">All Document Categories</option>
          <option value="Detailed Project Report (DPR)">Detailed Project Report (DPR)</option>
          <option value="Inspection Report">Inspection Report</option>
          <option value="Utilization Certificate (UC)">Utilization Certificate (UC)</option>
          <option value="Technical Sanction Order">Technical Sanction Order</option>
        </select>
      </div>

      {/* Main Grid: Document List & Preview Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((doc) => (
            <div 
              key={doc.document_id}
              onClick={() => handleInspectDoc(doc.document_id)}
              className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer transition-all hover:border-gov-navy ${
                selectedDoc?.document?.document_id === doc.document_id ? 'border-gov-navy bg-slate-50/50 ring-1 ring-gov-navy' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-gov-navy shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{doc.file_name}</h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {doc.document_type} • {doc.version_label} • {doc.issuing_authority}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Uploaded {doc.upload_date.slice(0, 10)} • Access: {doc.access_level}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    OCR {(doc.extraction_confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Document Preview & RAG Extracted Content */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit sticky top-20">
          {selectedDoc ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspecting Document</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{selectedDoc.document.file_name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  Project: <b>{selectedDoc.project_name}</b> ({selectedDoc.district})
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div><b>Issuing Authority:</b> {selectedDoc.document.issuing_authority}</div>
                <div><b>Access Level:</b> {selectedDoc.document.access_level}</div>
                <div><b>RAG Chunks Indexed:</b> {selectedDoc.chunks_count} chunks</div>
                <div><b>Extraction Confidence:</b> {(selectedDoc.extraction_confidence * 100).toFixed(1)}%</div>
              </div>

              <div>
                <div className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Extracted Text Content:</span>
                  <a
                    href={`/api/documents/${selectedDoc.document.document_id}/download-text`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-gov-navy hover:underline inline-flex items-center gap-0.5"
                  >
                    Download Text <Download className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {selectedDoc.extracted_text || 'No text extracted.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Select a document from the repository to inspect its metadata, OCR extraction confidence, and text chunks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
