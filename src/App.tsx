import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectMonitoringPage } from './pages/ProjectMonitoringPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { FinancialMonitoringPage } from './pages/FinancialMonitoringPage';
import { RisksIssuesPage } from './pages/RisksIssuesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataUploadPage } from './pages/DataUploadPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { api } from './api/client';
import { User } from './types';
import { Shield, Key, Lock, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const [aiAssistantInitialPrompt, setAiAssistantInitialPrompt] = useState<string>('');

  // Switch User Modal State
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Initial session restoration
  useEffect(() => {
    const initApp = async () => {
      setAuthLoading(true);
      try {
        const token = localStorage.getItem('up_dss_token');
        if (token) {
          try {
            const me = await api.getCurrentUser();
            setCurrentUser(me);
            localStorage.setItem('up_dss_user', JSON.stringify(me));
          } catch (err) {
            console.warn("Session expired or invalid token:", err);
            api.logout();
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        // Fetch demo users for persona switcher
        try {
          const users = await api.getDemoUsers();
          setAvailableUsers(users);
        } catch {}

        // Fetch alerts if logged in
        if (token) {
          try {
            const alerts = await api.getRiskAlerts();
            setActiveAlertsCount(alerts.length);
          } catch {}
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setLogoutNotice(null);
    try {
      const alerts = await api.getRiskAlerts();
      setActiveAlertsCount(alerts.length);
      const users = await api.getDemoUsers();
      setAvailableUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackFromProjectDetail = () => {
    setSelectedProjectId(null);
  };

  const handleAskAIAboutProject = (projectName: string) => {
    setAiAssistantInitialPrompt(`Provide an executive status summary, overdue milestones, and risk profile for project "${projectName}".`);
    setSelectedProjectId(null);
    setActiveTab('ai-assistant');
  };

  const handleSwitchUser = async (targetUser: User) => {
    try {
      // Determine demo credentials for the target role
      let pwd = 'Admin@123';
      if (targetUser.role === 'vendor') pwd = 'Vendor@123';
      else if (targetUser.role === 'monitor') pwd = 'Officer@123';
      else if (targetUser.role === 'viewer') pwd = 'Viewer@123';

      const res = await api.login(targetUser.email, pwd);
      setCurrentUser(res.user);
      setShowSwitchModal(false);
      setSelectedProjectId(null);
    } catch {
      setCurrentUser(targetUser);
      localStorage.setItem('up_dss_user', JSON.stringify(targetUser));
      setShowSwitchModal(false);
      setSelectedProjectId(null);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedProjectId(null);
    setShowSwitchModal(false);
    setLogoutNotice('You have been securely signed out. Please authenticate to access the UP Tourism DSS.');
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <img
          src="/up_logo.png"
          alt="Government of Uttar Pradesh Logo"
          className="w-16 h-16 object-contain rounded-full bg-white p-1 border-2 border-slate-300 shadow-md mb-4"
        />
        <div className="w-7 h-7 border-3 border-gov-navy border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-800 tracking-wide uppercase">
          Verifying UP Tourism DSS Session...
        </p>
        <p className="text-[11px] text-slate-500 mt-1">Connecting to Government of Uttar Pradesh Secure Gateway</p>
      </div>
    );
  }

  // Unauthenticated: Show dedicated LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} logoutNotice={logoutNotice} />;
  }

  return (
    <div className="min-h-screen bg-gov-page flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSwitchUser={() => setShowSwitchModal(true)}
        activeAlertsCount={activeAlertsCount}
        onNavigateToRisks={() => {
          setSelectedProjectId(null);
          setActiveTab('risks');
        }}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedProjectId(null);
            setActiveTab(tab);
          }}
          activeAlertsCount={activeAlertsCount}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-61px)]">
          {selectedProjectId ? (
            <ProjectDetailPage
              projectId={selectedProjectId}
              onBack={handleBackFromProjectDetail}
              onAskAIAboutProject={handleAskAIAboutProject}
              currentUser={currentUser}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <OverviewDashboard
                  onSelectProject={handleSelectProject}
                  onNavigateToTab={(tab) => {
                    setSelectedProjectId(null);
                    setActiveTab(tab);
                  }}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsPage onSelectProject={handleSelectProject} currentUser={currentUser} />
              )}

              {activeTab === 'monitoring' && (
                <ProjectMonitoringPage onSelectProject={handleSelectProject} />
              )}

              {activeTab === 'milestones' && <MilestonesPage />}

              {activeTab === 'financials' && <FinancialMonitoringPage />}

              {activeTab === 'risks' && (
                <RisksIssuesPage onSelectProject={handleSelectProject} />
              )}

              {activeTab === 'documents' && <DocumentsPage />}

              {activeTab === 'ai-assistant' && (
                <AIAssistantPage initialPrompt={aiAssistantInitialPrompt} />
              )}

              {activeTab === 'reports' && <ReportsPage />}

              {activeTab === 'upload' && <DataUploadPage />}

              {activeTab === 'users' && (
                <UserManagementPage
                  currentUser={currentUser}
                  onSwitchUser={handleSwitchUser}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Switch Persona / Login Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Select Official Persona</h2>
                <p className="text-xs text-slate-500">Government Role-Based Evaluation Mode</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Select one of the pre-configured UP Tourism officials to test role-based access permissions:
            </p>

            <div className="space-y-2.5">
              {availableUsers.map((u) => {
                const isSelected = currentUser?.user_id === u.user_id;
                return (
                  <button
                    key={u.user_id}
                    onClick={() => handleSwitchUser(u)}
                    className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-gov-navy bg-slate-50 ring-1 ring-gov-navy'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {u.full_name}
                        {u.role === 'vendor' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                            VENDOR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">{u.designation} • <span className="font-semibold text-gov-navy">Role: {u.role}</span></div>
                      {u.assigned_project_id && (
                        <div className="text-[10px] text-purple-700 font-mono mt-0.5 font-semibold">Assigned Project: {u.assigned_project_id}</div>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
