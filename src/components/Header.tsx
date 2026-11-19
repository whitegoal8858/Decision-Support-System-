import React from 'react';
import { Shield, Sparkles, User, LogOut, Bell, Info } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => void;
  onOpenSwitchUser: () => void;
  activeAlertsCount: number;
  onNavigateToRisks: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenSwitchUser,
  activeAlertsCount,
  onNavigateToRisks,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="flex items-center justify-between px-6 py-3.5">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3.5">
          <img
            src="/up_logo.png"
            alt="Government of Uttar Pradesh Logo"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border border-slate-300 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 tracking-tight text-base uppercase">
                Government of Uttar Pradesh
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Info className="w-3 h-3 mr-1 text-amber-600" />
                SYNTHETIC DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Department of Tourism & Culture • Project Monitoring & Decision Support System (DSS)
            </p>
          </div>
        </div>

        {/* Right: AI Engine status, Alert Pill, and User Profile */}
        <div className="flex items-center space-x-4">
          {/* AI Grounding Status */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Sparkles className="w-3.5 h-3.5 text-gov-navy" />
            <span className="font-medium">Decision Support AI: Grounded Engine Active</span>
          </div>

          {/* Risk Alerts Indicator */}
          <button 
            onClick={onNavigateToRisks}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Active Risk & Decision Alerts"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {activeAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          {currentUser ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
              <button 
                onClick={onOpenSwitchUser}
                className="text-left flex items-center space-x-2.5 hover:opacity-85 transition-opacity group"
                title="Click to Switch Demo Role / User"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : currentUser.role === 'vendor'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {currentUser.full_name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')}
                </div>
                <div>
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
                  <div className="text-[11px] text-slate-500 capitalize">
                    {currentUser.role === 'vendor' ? (
                      <span className="text-purple-700 font-semibold">{currentUser.assigned_project_id || 'Contractor Portal'}</span>
                    ) : currentUser.role === 'monitor' && currentUser.assigned_district ? (
                      <span>{currentUser.designation} • <span className="text-blue-700 font-bold">Nodal Jurisdiction: {currentUser.assigned_district}</span></span>
                    ) : (
                      <span>{currentUser.designation} • <span className="text-gov-navy font-semibold">{currentUser.role}</span></span>
                    )}
                  </div>
                </div>
              </button>
              
              {/* Distinct Sign Out Button */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all text-xs font-medium"
                title="Secure Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gov-navy text-white hover:bg-gov-navyLight shadow-xs"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
