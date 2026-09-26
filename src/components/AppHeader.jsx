import React, { useState } from 'react';
import { BadgeCheck, Bell, ChevronDown, Flame, LogOut, Menu, Search, Settings, UserCircle2 } from 'lucide-react';

const notifications = [
  { title: 'Meter installation completed', time: '2h ago' },
  { title: 'Invoice BIL-2609-0047 generated', time: '1d ago' },
  { title: 'Complaint CMP-2608-0874 in progress', time: '3d ago' },
];

function AppHeader({ profile, onMenuClick, onProfileAction }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900" style={{zIndex: 6000}} >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onMenuClick} className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-600/40 sm:flex">
            <Flame className="h-4.5 w-4.5" />
          </div>
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bills, contracts, complaints..."
              className="w-72 rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 md:flex">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
            ID: {profile.id}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((current) => !current);
                setProfileOpen(false);
              }}
              className="relative rounded-lg p-2 text-slate-300 transition hover:bg-slate-800"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <p className="border-b border-slate-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notifications
                </p>
                {notifications.map((item) => (
                  <div key={item.title} className="border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 hover:bg-slate-50">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 pr-3 transition hover:bg-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-white">{profile.name}</p>
                <p className="text-xs text-slate-400">{profile.category}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {[
                  ['My Profile', UserCircle2, 'profile'],
                  ['Settings', Settings, 'settings'],
                  ['Sign Out', LogOut, 'signout'],
                ].map(([label, Icon, action]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onProfileAction(action);
                    }}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                      action === 'signout' ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
