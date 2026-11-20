import React, { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle2, AlertTriangle, Search, Filter, Eye } from 'lucide-react';
import { api } from '../api/client';
import { Project } from '../types';

interface ProjectMonitoringPageProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectMonitoringPage: React.FC<ProjectMonitoringPageProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'all' | 'delayed' | 'gap' | 'stale'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProjects = projects.filter(p => {
    if (filterType === 'delayed') return p.project_status === 'Delayed';
    if (filterType === 'gap') return (p.physical_financial_gap || 0) > 15 && p.project_status !== 'Completed';
    if (filterType === 'stale') return (p.overdue_milestones_count || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Physical & Technical Monitoring Center
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Field Execution Control
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track verification workflows, milestone completion, and on-ground execution velocity
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all' ? 'bg-gov-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Works ({projects.length})
          </button>
          <button
            onClick={() => setFilterType('delayed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'delayed' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            Delayed ({projects.filter(p => p.project_status === 'Delayed').length})
          </button>
          <button
            onClick={() => setFilterType('gap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'gap' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Variance Gap &gt; 15%
          </button>
          <button
            onClick={() => setFilterType('stale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'stale' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            Overdue Milestones
          </button>
        </div>
      </div>

      {/* Grid of Monitored Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => {
          const isGap = (p.physical_financial_gap || 0) > 15 && p.project_status !== 'Completed';
          return (
            <div key={p.project_id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gov-navy">{p.external_project_id}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                    p.project_status === 'Delayed'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : p.project_status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {p.project_status}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-2" title={p.project_name}>
                  {p.project_name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {p.district} • {p.scheme_name}
                </p>

                {/* Progress Indicators */}
                <div className="space-y-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Physical Progress</span>
                      <span className="font-bold text-slate-900">{p.physical_progress_percent || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${p.physical_progress_percent || 0}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Financial Utilisation</span>
                      <span className={`font-bold ${isGap ? 'text-amber-600' : 'text-slate-900'}`}>
                        {p.financial_utilisation_percent || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isGap ? 'bg-amber-500' : 'bg-gov-navy'}`} 
                        style={{ width: `${Math.min(100, p.financial_utilisation_percent || 0)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Callout Notice for Gap */}
                {isGap && (
                  <div className="mt-3 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Variance Gap +{p.physical_financial_gap}% flagged for engineering audit.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Due: {p.revised_end_date || p.original_end_date}</span>
                <button
                  onClick={() => onSelectProject(p.project_id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-gov-navy hover:bg-gov-navy hover:text-white font-semibold transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Monitor Dossier
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
