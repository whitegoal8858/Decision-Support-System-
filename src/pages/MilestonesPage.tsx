import React, { useState, useEffect } from 'react';
import { CalendarCheck, Clock, AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react';
import { api } from '../api/client';
import { Milestone } from '../types';

export const MilestonesPage: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getMilestones();
        setMilestones(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = milestones.filter(m => {
    if (filter === 'overdue') return m.is_overdue || m.status === 'Overdue';
    if (filter === 'in_progress') return m.status === 'In Progress';
    if (filter === 'completed') return m.status === 'Completed';
    return true;
  }).filter(m => {
    if (!search) return true;
    return m.milestone_name.toLowerCase().includes(search.toLowerCase());
  });

  const overdueCount = milestones.filter(m => m.is_overdue || m.status === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Statewide Milestone Tracking Matrix
            {overdueCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
                {overdueCount} Overdue Flagged
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated tracking of civil, electrical, and MEP execution schedules
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'all' ? 'bg-gov-navy text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({milestones.length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search milestone tasks by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-navy"
          />
        </div>
      </div>

      {/* Milestones List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Milestone Activity</th>
                <th className="py-3 px-3">Planned Target Window</th>
                <th className="py-3 px-3 text-center">DPR Weightage</th>
                <th className="py-3 px-3 text-center">Progress %</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Remarks & Bottlenecks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => {
                const isOverdue = m.is_overdue || m.status === 'Overdue';
                return (
                  <tr key={m.milestone_id} className={`hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-red-50/20' : ''}`}>
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                      {m.milestone_name}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: {m.milestone_id.slice(0, 8)} • Project: {m.project_id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div>{m.planned_start} to <span className={isOverdue ? 'font-bold text-red-600' : ''}>{m.planned_end}</span></div>
                      {isOverdue && (
                        <div className="text-[10px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Past Scheduled Due Date
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {m.weightage_percent}%
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="font-bold text-slate-900">{m.completion_percent}%</div>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : 'bg-gov-navy'}`} 
                          style={{ width: `${m.completion_percent}%` }} 
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isOverdue
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : m.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {m.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={m.remarks}>
                      {m.remarks || 'Standard execution progress verified.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
