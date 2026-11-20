import React from 'react';
import { Shield, Sparkles, User, LogOut, Bell, Info, Menu, X } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenSwitchUser: () => void;
  activeAlertsCount: number;
  onNavigateToRisks: () => void;
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenSwitchUser,
  activeAlertsCount,
  onNavigateToRisks,
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Topmost Government Ribbon */}
      <div className="bg-[#0b2447] text-white text-[10px] sm:text-[11px] px-3 sm:px-6 py-1 flex items-center justify-between font-medium">
        <div className="truncate mr-2">
          <span>उत्तर प्रदेश सरकार • Government of Uttar Pradesh</span>
          <span className="hidden md:inline text-slate-300 ml-2">| Department of Tourism & Culture</span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline text-slate-200">NIC Cloud Gateway • SSL 256-bit</span>
          <span className="sm:hidden text-slate-300 text-[9px]">Gov Gateway</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5">
        {/* Left: Mobile Toggle + Emblem + Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0">
          {/* Hamburger Menu Toggle (Visible on Mobile only) */}
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
            title="Open Menu"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>

          <img
            src="/up_logo.png"
            alt="Government of Uttar Pradesh Logo"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full bg-white p-0.5 border border-slate-300 shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 tracking-tight text-xs sm:text-base uppercase truncate">
                Government of Uttar Pradesh
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                <Info className="w-2.5 h-2.5 mr-1 text-amber-600" />
                SYNTHETIC DEMO DATA
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden xs:block sm:block">
              Department of Tourism & Culture • Project Monitoring & Decision Support System (DSS)
            </p>
          </div>
        </div>

        {/* Right: AI Status, Alert Bell, and User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          {/* AI Grounding Status */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Sparkles className="w-3.5 h-3.5 text-gov-navy" />
            <span className="font-medium">Decision Support AI: Grounded Engine Active</span>
          </div>

          {/* Risk Alerts Indicator */}
          <button 
            onClick={onNavigateToRisks}
            className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Active Risk & Decision Alerts"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          {currentUser ? (
            <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
              <button 
                onClick={onOpenSwitchUser}
                className="text-left flex items-center space-x-2 hover:opacity-85 transition-opacity group"
                title="Click to Switch Demo Role / User"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : currentUser.role === 'vendor'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {currentUser.full_name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    {currentUser.full_name}
                    {currentUser.role === 'vendor' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 font-extrabold border border-purple-200">
                        VENDOR
                      </span>
                    )}
                    {currentUser.role === 'monitor' && currentUser.assigned_district && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-800 font-extrabold border border-blue-200">
                        {currentUser.assigned_district.toUpperCase()} ZONE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize truncate max-w-[200px]">
                    {currentUser.role === 'vendor' ? (
                      <span className="text-purple-700 font-semibold">{currentUser.assigned_project_id || 'Contractor Portal'}</span>
                    ) : currentUser.role === 'monitor' && currentUser.assigned_district ? (
                      <span>{currentUser.designation} • <span className="text-blue-700 font-bold">{currentUser.assigned_district}</span></span>
                    ) : (
                      <span>{currentUser.designation} • <span className="text-gov-navy font-semibold">{currentUser.role}</span></span>
                    )}
                  </div>
                </div>
              </button>
              
              {/* Distinct Sign Out Button */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all text-xs font-medium"
                title="Secure Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-gov-navy text-white hover:bg-gov-navyLight shadow-xs"
            >
              <User className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
