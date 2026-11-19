import React, { useState, useEffect } from 'react';
import { Landmark, IndianRupee, TrendingUp, AlertTriangle, CheckCircle2, Info, Search } from 'lucide-react';
import { api } from '../api/client';

export const FinancialMonitoringPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterGapOnly, setFilterGapOnly] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getFinancialSummary();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCr = (val: number) => (val / 1e7).toFixed(2);

  const projectsList = (data?.project_financials || []).filter((p: any) => {
    if (filterGapOnly && !p.gap_flagged) return false;
    if (!search) return true;
    return (
      p.project_name.toLowerCase().includes(search.toLowerCase()) ||
      p.external_project_id.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Financial Monitoring & Treasury Outlay
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Sanctions & Expenditure Audit
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation of administrative sanctions, central-state releases, and billed expenditures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterGapOnly(!filterGapOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterGapOnly
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Show Flagged Gaps Only ({data?.gap_flagged_count || 0})
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Approved DPR Sanction</div>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{data ? formatCr(data.total_approved_budget) : '--'} Cr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Initial administrative outlay</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Funds Released</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">₹{data ? formatCr(data.total_released) : '--'} Cr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">State & Central Treasury releases</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Expenditure Disbursed</div>
          <div className="text-xl font-bold text-gov-navy mt-1">₹{data ? formatCr(data.total_spent) : '--'} Cr</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disbursed to contractors via PFMS</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Overall Financial Utilisation</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{data?.overall_utilisation_percent || 0}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Against verified baseline</div>
        </div>
      </div>

      {/* Baseline Policy Banner */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-gov-navy shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-800">Departmental Baseline Policy & Audit Standards:</div>
          <div className="mt-0.5">
            <b>Financial Utilisation %</b> = <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-[11px]">Amount spent / selected baseline budget * 100</code>.
            Where an official Revised Sanction has been approved by the Expenditure Finance Committee (EFC), that revised figure serves as the baseline; otherwise, the original Approved DPR Sanction is used.
            Projects exhibiting a disbursement-to-physical variance &gt; 15% are flagged for administrative engineering measurement review and are never characterized as fraud without inquiry.
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search financial records by project, ID, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-navy"
          />
        </div>
      </div>

      {/* Financial Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Project Details</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Baseline Standard Used</th>
                <th className="py-3 px-3 text-right">Approved Outlay</th>
                <th className="py-3 px-3 text-right">Disbursed Spent</th>
                <th className="py-3 px-3 text-center">Fin Util %</th>
                <th className="py-3 px-3 text-center">Phys Prog %</th>
                <th className="py-3 px-3 text-right">Variance Gap</th>
                <th className="py-3 px-3">Audit Review Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectsList.map((p: any) => (
                <tr key={p.project_id} className={`hover:bg-slate-50/70 transition-colors ${p.gap_flagged ? 'bg-amber-50/20' : ''}`}>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-mono text-[11px] font-bold text-gov-navy">{p.external_project_id}</div>
                    <div className="font-semibold text-slate-900 mt-0.5 line-clamp-1" title={p.project_name}>{p.project_name}</div>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-800">{p.district}</td>

                  <td className="py-3 px-3">
                    <span className="text-[11px] text-slate-600 font-medium">{p.baseline_used}</span>
                    {p.revised_budget && (
                      <div className="text-[10px] text-amber-600 font-semibold">
                        Rev: ₹{formatCr(p.revised_budget)} Cr
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-medium text-slate-900">
                    ₹{formatCr(p.approved_budget)} Cr
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-gov-navy">
                    ₹{formatCr(p.amount_spent)} Cr
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`font-bold ${p.gap_flagged ? 'text-amber-600' : 'text-slate-900'}`}>
                      {p.utilisation_percent}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-emerald-700">
                    {p.physical_progress_percent}%
                  </td>

                  <td className="py-3 px-3 text-right">
                    {p.variance_gap > 0 ? (
                      <span className={`font-bold ${p.gap_flagged ? 'text-amber-600' : 'text-slate-700'}`}>
                        +{p.variance_gap}%
                      </span>
                    ) : (
                      <span className="text-slate-500">{p.variance_gap}%</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {p.gap_flagged ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Variance Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        Within Variance
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
