import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, 
  Info, Filter, ArrowUpRight, Eye, RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { RiskAlert } from '../types';

interface RisksIssuesPageProps {
  onSelectProject: (projectId: string) => void;
}

export const RisksIssuesPage: React.FC<RisksIssuesPageProps> = ({ onSelectProject }) => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await api.getRiskAlerts(params);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, categoryFilter]);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const mediumCount = alerts.filter(a => a.severity === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Explainable Risk Detection & Decision Engine
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-red-50 text-red-700 border border-red-200">
              Rule-Based Analytics
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic governance engine evaluating 7 statutory rules against verified monitoring baselines
          </p>
        </div>

        <button 
          onClick={fetchAlerts}
          className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Re-evaluate Risk Engine
        </button>
      </div>

      {/* Explanatory Rule Transparency Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
          <Info className="w-4 h-4 text-gov-navy" />
          Active Rule Registry & Grounded Thresholds
        </div>
        <p className="text-slate-600 mb-2">
          This system uses an explainable, deterministic rule engine. It provides factual, parameterised insights without unverified predictive claims:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 1:</b> Overdue Milestone (Planned end date expired and completion &lt; 100%)
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 2:</b> Physical Lag (Actual physical completion &gt; 15% behind planned DPR schedule)
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 3:</b> Variance Gap (Financial utilisation exceeds physical progress by &gt; 15%)
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 4:</b> Cost Overrun (Revised sanction exceeds initial approved DPR outlay)
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 5:</b> Critical Issue Overdue (High-severity issue open past target resolution date)
          </div>
          <div className="p-2 bg-white rounded border border-slate-200">
            <b className="text-slate-900">Rule 6 & 7:</b> Stale Progress (&gt;45 days without update) / Schedule Extensions
          </div>
        </div>
      </div>

      {/* Severity Filter Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => { setSeverityFilter(''); setCategoryFilter(''); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === '' ? 'bg-gov-navy text-white shadow-xs' : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">All Active Alerts</div>
          <div className="text-2xl font-bold mt-1">{alerts.length}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Across monitored projects</div>
        </button>

        <button
          onClick={() => setSeverityFilter('CRITICAL')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'CRITICAL' ? 'bg-red-700 text-white shadow-xs' : 'bg-white text-red-700 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">Critical Priority</div>
          <div className="text-2xl font-bold mt-1">{criticalCount}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Immediate secretarial action</div>
        </button>

        <button
          onClick={() => setSeverityFilter('HIGH')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'HIGH' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">High Severity</div>
          <div className="text-2xl font-bold mt-1">{highCount}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Substantial schedule/budget variance</div>
        </button>

        <button
          onClick={() => setSeverityFilter('MEDIUM')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'MEDIUM' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="text-xs font-medium opacity-80">Medium Severity</div>
          <div className="text-2xl font-bold mt-1">{mediumCount}</div>
          <div className="text-[11px] opacity-70 mt-0.5">Monitoring verification required</div>
        </button>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            No risk alerts matching the active filter.
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';

            return (
              <div 
                key={alert.alert_id}
                className={`bg-white rounded-xl border shadow-xs p-5 transition-all ${
                  isCritical ? 'border-red-300 bg-red-50/20' : isHigh ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {alert.severity} SEVERITY
                      </span>

                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {alert.alert_id}
                      </span>

                      <span className="text-xs text-slate-400">•</span>

                      <span className="text-xs font-bold text-slate-900">
                        {alert.risk_category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                      {alert.project_name} 
                      <span className="font-mono font-medium text-xs text-gov-navy">({alert.external_project_id})</span>
                    </h3>

                    <p className="text-xs text-slate-600 mt-0.5">
                      District: <b>{alert.district}</b> • Trigger Date: {alert.source_date}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectProject(alert.project_id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-gov-navy hover:text-white text-xs font-semibold text-gov-navy transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Dossier
                  </button>
                </div>

                {/* Triggering Condition & Relevant Values */}
                <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200/80 text-xs">
                  <div className="font-bold text-slate-800">Triggering Rule Condition:</div>
                  <div className="text-slate-700 mt-0.5">{alert.triggering_condition}</div>

                  {alert.relevant_values && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-600">
                      {Object.entries(alert.relevant_values).map(([k, v]) => (
                        <span key={k}>
                          <b>{k}:</b> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Next Action */}
                <div className="mt-3 flex items-start gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-gov-navy shrink-0">Recommended Administrative Action:</span>
                  <span className="text-slate-700">{alert.recommended_next_action}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
