import React from 'react';
import { Flame, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

function Sidebar({ navItems, activePath, onNavigate, mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 lg:self-start ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/40">
                <Flame className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-semibold text-white">CNG Portal</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:block"
          >
            {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          </button>
          <button type="button" onClick={onCloseMobile} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.path;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-lg border border-slate-700 bg-slate-800/60 p-3">
            <p className="text-xs text-slate-400">Need urgent help?</p>
            <p className="mt-1 text-sm font-semibold text-emerald-400">1800-266-0000</p>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
