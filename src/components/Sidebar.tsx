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
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeAlertsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeAlertsCount,
  isOpen = false,
  onClose,
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

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (onClose) {
      onClose();
    }
  };

  const renderNavLinks = () => (
    <div className="py-4 px-3 space-y-1">
      <div className="px-3 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
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
            onClick={() => handleItemClick(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-gov-navy text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAI ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            
            <div className="flex items-center space-x-1.5 shrink-0">
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
  );

  const renderFooterInfo = () => (
    <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 m-3 rounded-lg border">
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
        <Building2 className="w-4 h-4 text-gov-navy shrink-0" />
        <span className="truncate">Uttar Pradesh Tourism</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
        Paryatan Bhawan, C-13, Vipin Khand, Gomti Nagar, Lucknow.
      </p>
      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[9px] text-slate-400 flex items-center justify-between font-mono">
        <span>Govt. Portal v1.0</span>
        <span className="text-emerald-700 font-bold">LIVE ONLINE</span>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Stationary Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-200 h-[calc(100vh-61px)] sticky top-[61px] select-none shrink-0 overflow-y-auto">
        {renderNavLinks()}
        {renderFooterInfo()}
      </aside>

      {/* 2. Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Off-Canvas Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <img
              src="/up_logo.png"
              alt="UP Government Seal"
              className="w-8 h-8 rounded-full border border-slate-300 object-contain p-0.5 bg-white"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase">UP Tourism DSS</p>
              <p className="text-[10px] text-slate-500 font-medium">Administrative Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav List */}
        <div className="overflow-y-auto flex-1">
          {renderNavLinks()}
        </div>

        {/* Mobile Footer */}
        {renderFooterInfo()}
      </div>
    </>
  );
};
