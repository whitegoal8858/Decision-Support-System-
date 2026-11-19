import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Activity,
  CalendarCheck,
  Landmark,
  AlertTriangle,
  FileText,
  Bot,
  FileSpreadsheet,
  UploadCloud,
  Users,
  Building2,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeAlertsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Registry', icon: FolderKanban },
    { id: 'monitoring', label: 'Project Monitoring', icon: Activity },
    { id: 'milestones', label: 'Milestone Tracking', icon: CalendarCheck },
    { id: 'financials', label: 'Financial Monitoring', icon: Landmark },
    { 
      id: 'risks', 
      label: 'Risks & Decision Engine', 
      icon: AlertTriangle,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-red-100 text-red-700 border border-red-200'
    },
    { id: 'documents', label: 'Documents & RAG Hub', icon: FileText },
    { 
      id: 'ai-assistant', 
      label: 'AI Decision Assistant', 
      icon: Bot,
      isAI: true
    },
    { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
    { id: 'upload', label: 'Data Ingestion Pipeline', icon: UploadCloud },
    { id: 'users', label: 'Governance & Audit Logs', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-61px)] sticky top-[61px] select-none">
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 mb-2 border-b border-slate-100">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Administrative Menu
          </p>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gov-navy text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAI ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              
              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-gov-navy' : item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {item.isAI && (
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${isActive ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-700'}`}>
                    AI
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-lg border">
        <div className="flex items-center space-x-2 text-slate-800 font-semibold text-xs mb-1">
          <Building2 className="w-3.5 h-3.5 text-gov-navy" />
          <span>Uttar Pradesh Tourism</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Paryatan Bhawan, C-13, Vipin Khand, Gomti Nagar, Lucknow.
        </p>
        <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-400">
          Govt. Portal v1.0 • Hackathon Build
        </div>
      </div>
    </aside>
  );
};
