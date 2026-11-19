import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Building2, UserCheck, HardHat, FileSpreadsheet } from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  logoutNotice?: string | null;
}

interface DemoAccount {
  name: string;
  designation: string;
  department: string;
  role: 'admin' | 'monitor' | 'viewer' | 'vendor';
  email: string;
  password: string;
  assignedProject?: string;
  assignedDistrict?: string;
  badge: string;
  badgeColor: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Sajal Srivastava',
    designation: 'Director General - Tourism',
    department: 'Directorate of Tourism, Lucknow',
    role: 'admin',
    email: 'admin@uptourism.gov.in',
    password: 'Admin@123',
    badge: 'ADMINISTRATOR',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full statewide oversight: monitor all 75 districts, approve vendor measurement books, manage projects & users.',
  },
  {
    name: 'Er. Alok Srivastava (Varanasi Zone)',
    designation: 'Executive Engineer / Nodal Project In-Charge',
    department: 'Infrastructure & Projects Cell',
    role: 'monitor',
    email: 'officer@uptourism.gov.in',
    password: 'Officer@123',
    assignedDistrict: 'Varanasi',
    badge: 'NODAL IN-CHARGE (VARANASI)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Scoped Zonal Authority: Surveillance and inspection restricted solely to Varanasi District projects.',
  },
  {
    name: 'Er. Priya Sharma (Ayodhya Zone)',
    designation: 'Executive Engineer / Nodal Project In-Charge',
    department: 'Infrastructure & Projects Cell',
    role: 'monitor',
    email: 'officer.ayodhya@uptourism.gov.in',
    password: 'Officer@123',
    assignedDistrict: 'Ayodhya',
    badge: 'NODAL IN-CHARGE (AYODHYA)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Scoped Zonal Authority: Surveillance and inspection restricted solely to Ayodhya District projects.',
  },
  {
    name: 'Er. Ramesh Verma (Purvanchal Infra JV)',
    designation: 'Project Director (Contractor)',
    department: 'Purvanchal Infrastructure JV',
    role: 'vendor',
    email: 'vendor.varanasi@purvanchal.com',
    password: 'Vendor@123',
    assignedProject: 'UPT-VNS-2023-004 (Dashashwamedh Ghat)',
    badge: 'CONTRACTOR / VENDOR',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Restricted vendor access: limited strictly to Varanasi Ghat project. Submit physical progress for official approval.',
  },
  {
    name: 'Er. Vikram Seth (Bridge & Heritage Corp)',
    designation: 'Site In-charge (Contractor)',
    department: 'Bridge & Heritage Corp',
    role: 'vendor',
    email: 'vendor.ayodhya@heritagebuild.com',
    password: 'Vendor@123',
    assignedProject: 'UPT-AYD-2024-001 (Ram Ki Paidi)',
    badge: 'CONTRACTOR / VENDOR',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Restricted vendor access: limited strictly to Ayodhya Riverfront project. Submit work progress for verification.',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, logoutNotice }) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'personas'>('credentials');
  const [email, setEmail] = useState<string>('admin@uptourism.gov.in');
  const [password, setPassword] = useState<string>('Admin@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail || 'Authentication failed. Please verify official email and password.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersonaLogin = async (acc: DemoAccount) => {
    setError(null);
    setLoading(true);
    setEmail(acc.email);
    setPassword(acc.password);

    try {
      const res = await api.login(acc.email, acc.password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      console.error('Persona login error:', err);
      const detail = err.response?.data?.detail || 'Persona login failed. Please try again.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Government Strip */}
      <div className="bg-gov-navy text-white px-6 sm:px-10 py-3.5 border-b border-blue-900/40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <img
              src="/up_logo.png"
              alt="Government of Uttar Pradesh Logo"
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-full bg-white p-1 border-2 border-amber-300/60 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-wide text-sm sm:text-base text-white">
                  उत्तर प्रदेश सरकार • Government of Uttar Pradesh
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                Department of Tourism & Culture • पर्यटन एवं संस्कृति विभाग
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2.5 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/15">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-100 font-semibold text-xs tracking-wide">
              NIC Cloud Gateway • SSL 256-bit Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Hero / Branding Panel (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-br from-gov-navy via-[#1e3a68] to-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background seal watermarking */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full border-8 border-white/5 pointer-events-none"></div>
            <div className="absolute right-6 top-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none"></div>

            <div>
              {/* Crest & Title */}
              <div className="flex items-center space-x-3.5 mb-6">
                <img
                  src="/up_logo.png"
                  alt="Government of Uttar Pradesh Logo"
                  className="w-12 h-12 object-contain rounded-full bg-white p-1 border border-white/20 shadow-inner"
                />
                <div>
                  <h2 className="text-sm font-bold tracking-tight uppercase text-white">UP Tourism DSS</h2>
                  <p className="text-[11px] text-slate-300 font-medium">Decision Support System</p>
                </div>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-white leading-snug mb-3">
                Project Monitoring & Decision Support System
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralised, AI-grounded monitoring platform for capital tourism infrastructure, heritage corridors, and pilgrim amenities across Uttar Pradesh.
              </p>

              {/* Highlights */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Statewide Project & Financial Tracking (75 Districts)</span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Role-Based Access Control (Admin, Monitor & Vendor Portals)</span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Contractor Progress Submission & Official Verification</span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Grounding-Safe GenAI Project Intelligence & Risk Engine</span>
                </div>
              </div>
            </div>

            {/* Bottom official footer */}
            <div className="pt-6 mt-6 border-t border-white/10 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300">Authorized by:</p>
              <p>Sajal Srivastava, Director General - Tourism</p>
              <p className="text-[10px] text-slate-400 mt-1">Govt. of Uttar Pradesh • Department of Tourism & Culture</p>
            </div>
          </div>

          {/* Right Authentication Panel (7 cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Logout Notice banner */}
              {logoutNotice && (
                <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{logoutNotice}</span>
                </div>
              )}

              {/* Error Message banner */}
              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Mode Switcher Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'credentials'
                      ? 'bg-gov-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Official Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('personas')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab === 'personas'
                      ? 'bg-gov-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>1-Click Evaluator Roles</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400 text-slate-900 font-extrabold">DEMO</span>
                </button>
              </div>

              {/* Tab 1: Official Credentials Form */}
              {activeTab === 'credentials' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. admin@uptourism.gov.in or vendor email"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Department officials, Project Officers, or registered contractors.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password / Security PIN
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick autofill helper */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">Admin Login:</span> admin@uptourism.gov.in / Admin@123
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@uptourism.gov.in');
                        setPassword('Admin@123');
                      }}
                      className="text-gov-navy hover:underline font-bold text-[10px]"
                    >
                      Fill Admin
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-gov-navy hover:bg-[#1a345e] text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        <span>Authenticating with NIC Gateway...</span>
                      </span>
                    ) : (
                      <>
                        <span>Sign In to DSS Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Tab 2: 1-Click Evaluator Roles */}
              {activeTab === 'personas' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 mb-2">
                    Click any pre-configured role below to log in instantly and evaluate role-specific dashboards & permissions:
                  </p>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <div
                        key={acc.email}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-gov-navy/50 hover:bg-slate-50/70 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${acc.badgeColor}`}>
                                {acc.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">{acc.designation}</p>
                            {acc.assignedProject && (
                              <p className="text-[10px] text-purple-700 font-bold font-mono mt-0.5">
                                Assigned Project: {acc.assignedProject}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{acc.description}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">{acc.email}</span>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleQuickPersonaLogin(acc)}
                            className="px-3 py-1 bg-slate-900 hover:bg-gov-navy text-white rounded text-[11px] font-bold transition-all shadow-xs flex items-center space-x-1"
                          >
                            <span>Log In</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>Authorised government personnel only. All access is logged with immutable IP & timestamp auditing.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500">
        <p>
          © 2026 Department of Tourism & Culture, Government of Uttar Pradesh • Project Monitoring & Decision Support System (DSS)
        </p>
      </footer>
    </div>
  );
};
