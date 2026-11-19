import React, { useState, useEffect } from 'react';
import { 
  Building, CheckCircle2, Clock, AlertTriangle, IndianRupee, 
  TrendingUp, Activity, Filter, RefreshCw, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid 
} from 'recharts';
import { api } from '../api/client';
import { DashboardSummary, User } from '../types';

interface OverviewDashboardProps {
  onSelectProject: (projectId: string) => void;
  onNavigateToTab: (tab: string) => void;
  currentUser?: User | null;
}

const STATUS_COLORS: Record<string, string> = {
  Ongoing: '#0284c7',   // blue-600
  Delayed: '#dc2626',   // red-600
  Completed: '#16a34a', // green-600
  'Under Review': '#ea580c', // orange-600
  Tender: '#9333ea',    // purple-600
};

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
  onSelectProject, 
  onNavigateToTab,
  currentUser
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedScheme) params.scheme = selectedScheme;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedCategory) params.category = selectedCategory;

      const [sumData, chartData] = await Promise.all([
        api.getDashboardSummary(params),
        api.getDashboardCharts(params)
      ]);
      setSummary(sumData);
      setCharts(chartData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, selectedScheme, selectedStatus, selectedCategory]);

  const formatCr = (amount: number) => {
    return (amount / 1e7).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Statewide Tourism Portfolio Overview
            <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Executive View
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring of infrastructure projects across 75 districts of Uttar Pradesh
          </p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-xs font-medium text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Filters:
          </div>
          
          <select 
            value={selectedDistrict} 
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-navy"
          >
            <option value="">All Districts ({charts?.filter_options?.districts?.length || 0})</option>
            {charts?.filter_options?.districts?.map((d: string) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select 
            value={selectedScheme} 
            onChange={(e) => setSelectedScheme(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-navy"
          >
            <option value="">All Schemes</option>
            {charts?.filter_options?.schemes?.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gov-navy"
          >
            <option value="">All Statuses</option>
            {charts?.filter_options?.statuses?.map((st: string) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {(selectedDistrict || selectedScheme || selectedStatus || selectedCategory) && (
            <button
              onClick={() => {
                setSelectedDistrict('');
                setSelectedScheme('');
                setSelectedStatus('');
                setSelectedCategory('');
              }}
              className="text-xs text-red-600 hover:text-red-700 px-2 py-1 font-medium underline"
            >
              Reset
            </button>
          )}

          <button 
            onClick={fetchData} 
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Nodal Officer Jurisdictional Scope Alert */}
      {currentUser?.role === 'monitor' && currentUser?.assigned_district && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0"></span>
            <div>
              <span className="font-bold uppercase tracking-wider text-blue-900">
                Nodal Jurisdictional Filter Active ({currentUser.assigned_district} Zone):
              </span>
              <span className="text-blue-800 ml-1.5 font-medium">
                You are assigned to <b>{currentUser.assigned_district} District</b> ({currentUser.assigned_zone || 'Zonal Authority'}). Metrics, expenditure, and milestones reflect solely your jurisdiction.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-blue-200/80 text-blue-950 font-extrabold text-[10px] uppercase border border-blue-300 shrink-0">
            Field Monitor Scope
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Projects */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Projects</span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {summary?.total_projects ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Approved Baseline</span>
            <span className="font-semibold text-slate-700">100%</span>
          </div>
        </div>

        {/* Ongoing */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ongoing Active</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {summary?.ongoing_projects ?? '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            In active civil execution
          </div>
        </div>

        {/* Delayed */}
        <div 
          onClick={() => onNavigateToTab('monitoring')}
          className="bg-white p-4 rounded-xl border border-red-200 shadow-xs cursor-pointer hover:border-red-300 transition-colors"
        >
          <div className="flex items-center justify-between text-red-600 text-xs font-medium">
            <span>Delayed Projects</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {summary?.delayed_projects ?? '--'}
          </div>
          <div className="text-[11px] text-red-700 mt-1 font-medium flex items-center">
            <span>Requires Intervention</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {summary?.completed_projects ?? '--'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Commissioned & Handed over
          </div>
        </div>

        {/* Total Sanction Outlay */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sanctioned Budget</span>
            <IndianRupee className="w-4 h-4 text-gov-navy" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{summary ? formatCr(summary.total_approved_budget) : '--'}
            <span className="text-xs font-normal text-slate-500 ml-1">Cr</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate" title={summary?.budget_baseline_used}>
            Revised: ₹{summary ? formatCr(summary.total_revised_budget) : '--'} Cr
          </div>
        </div>

        {/* Expenditure & Utilisation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Disbursed & Spent</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gov-navy mt-2">
            ₹{summary ? formatCr(summary.total_expenditure) : '--'}
            <span className="text-xs font-normal text-slate-500 ml-1">Cr</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>Utilisation:</span>
            <span className="font-bold text-slate-900">{summary?.overall_financial_utilisation}%</span>
          </div>
        </div>
      </div>

      {/* Progress & Baseline Summary Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Overall Statewide Physical Progress</span>
            <span className="text-xs font-bold text-slate-900">{summary?.overall_physical_progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gov-navy h-full rounded-full transition-all duration-500"
              style={{ width: `${summary?.overall_physical_progress || 0}%` }}
            />
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Financial Utilisation Against Sanctions</span>
            <span className="text-xs font-bold text-slate-900">{summary?.overall_financial_utilisation}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (summary?.overall_financial_utilisation || 0) > (summary?.overall_physical_progress || 0) + 15
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, summary?.overall_financial_utilisation || 0)}%` }}
            />
          </div>
        </div>

        <div className="border-l border-slate-200 pl-6 hidden lg:block text-xs">
          <div className="text-slate-500 font-medium">Projects Requiring Attention</div>
          <div className="text-lg font-bold text-red-600 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {summary?.attention_required_projects || 0} Projects Flagged
          </div>
          <button 
            onClick={() => onNavigateToTab('risks')}
            className="text-[11px] text-gov-navy font-semibold hover:underline mt-1 inline-flex items-center"
          >
            Review Explainable Risks <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Primary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Project Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Project Status Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown by current operational milestone phase</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.status_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts?.status_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: District-wise Project Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-900 mb-1">District-wise Project Allocations</h2>
          <p className="text-xs text-slate-500 mb-4">Total monitored tourism infrastructure works by key district</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.district_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0B3B60" radius={[4, 4, 0, 0]} name="Projects Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts: Physical vs Financial Variance & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Physical vs Financial Progress Gap */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-900">Physical vs Financial Utilisation by Project</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Rule 3 Variance Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Comparison of financial disbursement % vs verified on-ground completion %</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(charts?.physical_vs_financial || []).slice(0, 8)} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="external_id" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value}%`, name]}
                  labelFormatter={(label) => `Project ID: ${label}`}
                />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                <Bar dataKey="physical_progress" fill="#059669" name="Physical Progress %" radius={[3, 3, 0, 0]} />
                <Bar dataKey="financial_utilisation" fill="#0284c7" name="Financial Utilisation %" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Monthly Progress Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Statewide Portfolio Progress Trend</h2>
          <p className="text-xs text-slate-500 mb-4">Planned DPR schedule vs actual verified field execution average</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.monthly_trend || []} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`${value}%`]} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                <Line type="monotone" dataKey="planned_average" stroke="#94a3b8" strokeDasharray="5 5" name="Planned Schedule %" strokeWidth={2} />
                <Line type="monotone" dataKey="actual_average" stroke="#0B3B60" name="Actual Physical Average %" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Flagged Projects Quick Action Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Key Projects Requiring Executive Review</h2>
            <p className="text-xs text-slate-500">Projects with schedule delays or significant physical-financial variance</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('projects')}
            className="text-xs font-semibold text-gov-navy hover:underline flex items-center"
          >
            View Complete Registry ({summary?.total_projects || 0}) <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Project ID</th>
                <th className="py-2.5 px-3">Project Name</th>
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Physical %</th>
                <th className="py-2.5 px-3 text-right">Financial %</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(charts?.physical_vs_financial || [])
                .filter((p: any) => p.status === 'Delayed' || p.gap > 15)
                .slice(0, 6)
                .map((p: any) => (
                  <tr key={p.project_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{p.external_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs truncate" title={p.project_name}>
                      {p.project_name}
                    </td>
                    <td className="py-2.5 px-3">{p.district}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        p.status === 'Delayed' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{p.physical_progress}%</td>
                    <td className="py-2.5 px-3 text-right font-medium">{p.financial_utilisation}%</td>
                    <td className="py-2.5 px-3 text-right">
                      {p.gap > 15 ? (
                        <span className="font-bold text-amber-600">+{p.gap}%</span>
                      ) : (
                        <span className="text-slate-500">{p.gap}%</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button 
                        onClick={() => onSelectProject(p.project_id)}
                        className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 hover:bg-gov-navy hover:text-white font-medium transition-colors"
                      >
                        Inspect
                      </button>
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
