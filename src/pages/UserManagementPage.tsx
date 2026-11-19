import React, { useState, useEffect } from 'react';
import { Users, Shield, History, UserCheck, Key, Lock, CheckCircle2, UserPlus, X, Building2, HardHat, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { User, Project } from '../types';

interface UserManagementPageProps {
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
}

export const UserManagementPage: React.FC<UserManagementPageProps> = ({ 
  currentUser,
  onSwitchUser 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Register User/Vendor Modal State
  const [showAddVendorModal, setShowAddVendorModal] = useState<boolean>(false);
  const [vendorForm, setVendorForm] = useState({
    role: 'vendor' as 'vendor' | 'monitor',
    full_name: '',
    vendor_company: '',
    email: '',
    password: 'User@123',
    assigned_project_id: '',
    assigned_district: '',
    designation: 'Site In-charge / Project Director',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, logData, projData] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(),
        api.getProjects()
      ]);
      setUsers(userData);
      setAuditLogs(logData);
      setProjects(projData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await api.createUser({
        full_name: vendorForm.full_name,
        email: vendorForm.email.trim(),
        password: vendorForm.password,
        role: vendorForm.role,
        vendor_company: vendorForm.role === 'vendor' ? vendorForm.vendor_company : undefined,
        assigned_project_id: vendorForm.role === 'vendor' ? vendorForm.assigned_project_id : undefined,
        assigned_district: vendorForm.role === 'monitor' ? vendorForm.assigned_district : undefined,
        assigned_zone: vendorForm.role === 'monitor' ? `${vendorForm.assigned_district} Zone` : undefined,
        department: vendorForm.role === 'vendor' ? (vendorForm.vendor_company || 'Contractor Agency') : 'Infrastructure & Projects Cell',
        designation: vendorForm.designation
      });

      setFormSuccess(`${vendorForm.role === 'vendor' ? 'Contractor' : 'Nodal Officer'} "${vendorForm.full_name}" registered successfully!`);
      setVendorForm({
        role: 'vendor',
        full_name: '',
        vendor_company: '',
        email: '',
        password: 'User@123',
        assigned_project_id: '',
        assigned_district: '',
        designation: 'Site In-charge / Project Director',
      });
      await loadData();
      setTimeout(() => {
        setShowAddVendorModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to register account. Please check email or required fields.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Governance, Role-Based Access & Audit Trail
            <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Security Matrix
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorised government roles, immutable action logging, vendor provisioning, and human-in-the-loop approval safeguards
          </p>
        </div>

        {/* Admin Action: Register New User / Vendor */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gov-navy hover:bg-[#1a345e] text-white rounded-lg text-xs font-bold shadow-xs transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Provision Account (Vendor / Nodal Officer)</span>
          </button>
        )}
      </div>

      {/* Role Matrix Cards & Quick Switcher */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Authorised Personas & System Users ({users.length}):
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click card to switch session</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {users.map((u) => {
            const isCurrent = currentUser?.user_id === u.user_id;
            const isVendor = u.role === 'vendor';
            return (
              <div 
                key={u.user_id}
                className={`bg-white p-5 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${
                  isCurrent ? 'border-gov-navy ring-2 ring-gov-navy bg-slate-50/40' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : u.role === 'monitor'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : isVendor
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      Role: {u.role}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active Session
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-2">{u.full_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{u.designation}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{u.department}</p>

                  {isVendor && u.assigned_project_id && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-purple-700 block">Assigned Project Scope:</span>
                      <span className="font-mono font-bold text-purple-900">{u.assigned_project_id}</span>
                      {u.vendor_company && (
                        <div className="text-slate-600 text-[10px] mt-0.5 font-sans">
                          Firm: <b>{u.vendor_company}</b>
                        </div>
                      )}
                    </div>
                  )}

                  {u.role === 'monitor' && u.assigned_district && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Zonal Jurisdiction Scope:</span>
                      <span className="font-bold text-blue-900">{u.assigned_district} District</span>
                      {u.assigned_zone && (
                        <div className="text-slate-600 text-[10px] mt-0.5">
                          Zone: <b>{u.assigned_zone}</b>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div><b>Official Email:</b> {u.email}</div>
                    <div><b>Permissions:</b> {
                      u.role === 'admin' 
                        ? 'Full administrative control, project creation, user management, statewide oversight' 
                        : u.role === 'monitor'
                        ? `Surveillance, field inspections, and progress monitoring scoped to ${u.assigned_district || 'assigned zone'}`
                        : isVendor
                        ? 'Submit progress for assigned project only (Pending verification status)'
                        : 'Read-only dashboard, reports download, audit review'
                    }</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSwitchUser(u)}
                    disabled={isCurrent}
                    className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-gov-navy text-white hover:bg-gov-navyLight shadow-xs'
                    }`}
                  >
                    {isCurrent ? 'Currently Active' : `Switch Persona to ${u.role}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Audit Log Stream */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-gov-navy" />
              Statutory System Audit Trail
            </h2>
            <p className="text-xs text-slate-500">Immutable chronological record of administrative actions and status transitions</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Top {auditLogs.length} Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Record Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.audit_id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.action_timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {log.actor_name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-gov-navy border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">
                    {log.entity_type} ({log.entity_id?.slice(0, 8)}...)
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.after_value || {})}>
                    {JSON.stringify(log.after_value || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Contractor / Vendor */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-800 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Provision Contractor / Vendor Account</h3>
                  <p className="text-xs text-slate-500">Assign project scope and generate secure login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-3.5">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Type / Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVendorForm({ ...vendorForm, role: 'vendor', designation: 'Site In-charge / Project Director' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      vendorForm.role === 'vendor'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Contractor / Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => setVendorForm({ ...vendorForm, role: 'monitor', designation: 'Executive Engineer / Nodal In-Charge' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      vendorForm.role === 'monitor'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nodal Project In-Charge
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {vendorForm.role === 'vendor' ? 'Contractor Representative Name *' : 'Nodal Officer Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.full_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, full_name: e.target.value })}
                  placeholder={vendorForm.role === 'vendor' ? "e.g. Er. Anurag Kashyap" : "e.g. Er. Alok Srivastava"}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {vendorForm.role === 'vendor' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contractor / Agency Firm *
                    </label>
                    <input
                      type="text"
                      required
                      value={vendorForm.vendor_company}
                      onChange={(e) => setVendorForm({ ...vendorForm, vendor_company: e.target.value })}
                      placeholder="e.g. Shri Ram Infra Ltd"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned District Jurisdiction *
                    </label>
                    <select
                      required
                      value={vendorForm.assigned_district}
                      onChange={(e) => setVendorForm({ ...vendorForm, assigned_district: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                    >
                      <option value="">-- Select District Scope --</option>
                      {['Varanasi', 'Ayodhya', 'Mathura', 'Agra', 'Prayagraj', 'Lucknow', 'Jhansi', 'Gorakhpur', 'Chitrakoot', 'Kushinagar'].map((d) => (
                        <option key={d} value={d}>{d} District & Zone</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={vendorForm.designation}
                    onChange={(e) => setVendorForm({ ...vendorForm, designation: e.target.value })}
                    placeholder="e.g. Project Director"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder={vendorForm.role === 'vendor' ? "vendor@company.com" : "officer@uptourism.gov.in"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.password}
                    onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                    placeholder="User@123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                  />
                </div>
              </div>

              {vendorForm.role === 'vendor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assign Project Scope *
                  </label>
                  <select
                    required
                    value={vendorForm.assigned_project_id}
                    onChange={(e) => setVendorForm({ ...vendorForm, assigned_project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                  >
                    <option value="">-- Select Project from Registry --</option>
                    {projects.map((p) => (
                      <option key={p.project_id} value={p.external_project_id || p.project_id}>
                        {p.external_project_id} - {p.project_name} ({p.district})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    The vendor will only have permission to view and submit measurements for this assigned project.
                  </p>
                </div>
              )}

              {vendorForm.role === 'monitor' && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
                  <b>Jurisdictional Scope:</b> When logged in, this Nodal Officer will only see projects, financial metrics, and risk alerts for their assigned district ({vendorForm.assigned_district || 'Selected District'}).
                </div>
              )}

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gov-navy hover:bg-[#1a345e] text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{vendorForm.role === 'vendor' ? 'Provision Vendor' : 'Provision Nodal Officer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
