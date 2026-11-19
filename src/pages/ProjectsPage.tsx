import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Eye, Edit3, ArrowUpDown, 
  Building2, Calendar, MapPin, IndianRupee, AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { Project, User } from '../types';

interface ProjectsPageProps {
  onSelectProject: (projectId: string) => void;
  currentUser?: User | null;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject, currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filters
  const [search, setSearch] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedScheme, setSelectedScheme] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [order, setOrder] = useState<string>('desc');

  // New Project Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    external_project_id: '',
    project_name: '',
    scheme_name: 'Swadesh Darshan 2.0',
    district: 'Varanasi',
    category: 'Pilgrim Amenities',
    implementing_agency: 'UP Tourism Development Corporation (UPTDC)',
    awarded_vendor: '',
    project_manager: 'Er. R. K. Sharma',
    start_date: new Date().toISOString().split('T')[0],
    original_end_date: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    approved_budget: 250000000,
    project_status: 'Ongoing' as Project['project_status']
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort_by: sortBy, order };
      if (search) params.search = search;
      if (selectedDistrict) params.district = selectedDistrict;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedScheme) params.scheme = selectedScheme;

      const data = await api.getProjects(params);
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, selectedDistrict, selectedStatus, selectedScheme, sortBy, order]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createProject({
        ...formData,
        approved_budget: Number(formData.approved_budget)
      });
      setShowCreateModal(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to create project");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {currentUser?.role === 'vendor' ? 'My Contracted Projects' : 'Official Projects Registry'}
            {currentUser?.role === 'vendor' && (
              <span className="text-xs px-2.5 py-0.5 rounded font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Vendor Workspace
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.role === 'vendor' 
              ? `Displaying projects assigned to ${currentUser.vendor_company || 'your agency'} for execution and progress reporting`
              : 'Authoritative directory of tourism and cultural infrastructure works in Uttar Pradesh'}
          </p>
        </div>

        {currentUser?.role !== 'vendor' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-gov-navy text-white hover:bg-gov-navyLight shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Register New Project
          </button>
        )}
      </div>

      {currentUser?.role === 'vendor' && (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Role-Based Access Control Notice: Vendor Execution Mode</div>
            <div className="mt-0.5 text-purple-800">
              You are logged in as <b>{currentUser.full_name}</b> ({currentUser.vendor_company}). You have permission to submit measurement book entries and report milestone progress on your assigned works. New progress entries require verification by Department Officials.
            </div>
          </div>
        </div>
      )}

      {currentUser?.role === 'monitor' && currentUser?.assigned_district && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>Jurisdictional Scope: {currentUser.assigned_district} District & Zone</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-200 text-blue-900 font-extrabold uppercase">
                NODAL IN-CHARGE
              </span>
            </div>
            <div className="mt-0.5 text-blue-800">
              You are authenticated as <b>{currentUser.full_name}</b>, Nodal Project Officer for <b>{currentUser.assigned_district}</b>. In accordance with departmental governance, you have surveillance and monitoring access exclusively over projects within your assigned district jurisdiction.
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name, ID, district or executing agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gov-navy bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700"
          >
            <option value="">All Districts</option>
            {Array.from(new Set(projects.map(p => p.district))).sort().map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
            <option value="Under Review">Under Review</option>
            <option value="Tender">Tender</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700"
          >
            <option value="created_at">Sort by: Date Added</option>
            <option value="budget">Sort by: Approved Budget</option>
            <option value="progress">Sort by: Physical Progress</option>
            <option value="name">Sort by: Project Name</option>
          </select>

          <button
            onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Project ID & Name</th>
                <th className="py-3 px-3">District & Location</th>
                <th className="py-3 px-3">Scheme & Agency</th>
                <th className="py-3 px-3 text-right">Sanctioned Outlay</th>
                <th className="py-3 px-3 text-center">Physical %</th>
                <th className="py-3 px-3 text-center">Financial %</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading project records...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No project records match the active criteria.</td>
                </tr>
              ) : (
                projects.map((p) => {
                  const isGap = (p.physical_financial_gap || 0) > 15 && p.project_status !== 'Completed';
                  return (
                    <tr key={p.project_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-mono text-[11px] font-bold text-gov-navy">{p.external_project_id}</div>
                        <div className="font-semibold text-slate-900 mt-0.5 line-clamp-1" title={p.project_name}>
                          {p.project_name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Target: {p.original_end_date} {p.revised_end_date && `(Ext: ${p.revised_end_date})`}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {p.district}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={p.location_description}>
                          {p.location_description || p.category}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{p.scheme_name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={p.implementing_agency}>
                          {p.implementing_agency}
                        </div>
                        {p.awarded_vendor ? (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 w-fit max-w-[150px] truncate" title={`Awarded Contractor: ${p.awarded_vendor}`}>
                            <span>🏗️ {p.awarded_vendor}</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-[9px] text-slate-400 font-medium">No vendor assigned</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900">₹{(p.approved_budget / 1e7).toFixed(2)} Cr</div>
                        {p.revised_budget && (
                          <div className="text-[10px] text-amber-600 font-medium">
                            Rev: ₹{(p.revised_budget / 1e7).toFixed(2)} Cr
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-900">{p.physical_progress_percent || 0}%</div>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${p.physical_progress_percent || 0}%` }} />
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className={`font-bold ${isGap ? 'text-amber-600' : 'text-slate-900'}`}>
                          {p.financial_utilisation_percent || 0}%
                        </div>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isGap ? 'bg-amber-500' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.min(100, p.financial_utilisation_percent || 0)}%` }} 
                          />
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.project_status === 'Delayed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : p.project_status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.project_status === 'Under Review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {p.project_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectProject(p.project_id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-gov-navy hover:bg-gov-navy hover:text-white font-medium transition-colors text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Project Registration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">Register New Tourism Infrastructure Project</h2>
            <p className="text-xs text-slate-500 mb-4">Add new administrative record to the statewide monitoring registry</p>

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">External Government Project ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UPT-VNS-2024-020"
                    value={formData.external_project_id}
                    onChange={(e) => setFormData({ ...formData, external_project_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-gov-navy"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Scheme Name *</label>
                  <select
                    value={formData.scheme_name}
                    onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Swadesh Darshan 2.0">Swadesh Darshan 2.0</option>
                    <option value="PRASHAD Scheme">PRASHAD Scheme</option>
                    <option value="State Tourism Infrastructure Fund">State Tourism Infrastructure Fund</option>
                    <option value="Maha Kumbh 2025 Mission Scheme">Maha Kumbh 2025 Mission Scheme</option>
                    <option value="Buddhist Circuit Infrastructure Mission">Buddhist Circuit Infrastructure Mission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Name (Official DPR Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Construction of Pilgrim Orientation Centre and Heritage Plaza..."
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status *</label>
                  <select
                    value={formData.project_status}
                    onChange={(e) => setFormData({ ...formData, project_status: e.target.value as Project['project_status'] })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Completed">Completed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Tender">Tender</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Implementing Agency *</label>
                  <input
                    type="text"
                    required
                    value={formData.implementing_agency}
                    onChange={(e) => setFormData({ ...formData, implementing_agency: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Awarded Contractor / Executing Vendor</label>
                  <input
                    type="text"
                    value={formData.awarded_vendor}
                    onChange={(e) => setFormData({ ...formData, awarded_vendor: e.target.value })}
                    placeholder="e.g. Purvanchal Infrastructure JV / Bridge & Heritage Corp"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Agency assigned for execution & progress reporting</p>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Approved Budget (INR) *</label>
                <input
                  type="number"
                  required
                  value={formData.approved_budget}
                  onChange={(e) => setFormData({ ...formData, approved_budget: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Original End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.original_end_date}
                    onChange={(e) => setFormData({ ...formData, original_end_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-navy text-white rounded-lg hover:bg-gov-navyLight font-semibold"
                >
                  Confirm & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
