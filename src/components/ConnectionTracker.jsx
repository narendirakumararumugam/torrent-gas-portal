import React from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FileSignature,
  HardHat,
  MapPin,
  Phone,
  Radio,
  Route,
  Wrench,
  Zap,
} from 'lucide-react';
import Card from './common/Card';
import Badge from './common/Badge';
import CircularProgress from './common/CircularProgress';
import TimelineIcon from './common/TimelineIcon';
import CustomerCollaborationPanel from './common/CustomerCollaborationPanel';
import { projectManager, timelineEvents, trackerEta, trackerProgress } from '../data/connectionTimeline';
import { contractProfile } from '../data/contractProfile';

const iconMap = {
  registration: { Icon: FileCheck2 },
  agreement: { Icon: FileSignature },
  feasibility: { Icon: MapPin, Secondary: Compass },
  pipeline: { Icon: Route },
  meter: { Icon: Wrench, Secondary: HardHat },
  quality: { Icon: ClipboardCheck },
  activation: { Icon: Zap },
};

const lineTone = {
  completed: 'bg-emerald-500',
  active: 'bg-orange-400 animate-pulse',
  upcoming: 'bg-slate-200',
};

/* Summary metrics strip: progress ring, activation date, project manager contact */
function SummaryPanel() {
  return (
    <Card className="grid gap-6 p-6 sm:grid-cols-3">
      <div className="flex items-center gap-4">
        <CircularProgress value={trackerProgress} label="Progress" />
        <div>
          <p className="text-xs font-medium text-slate-400">Project Progress</p>
          <p className="text-lg font-bold text-[#2D3748]">{trackerProgress}% Complete</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:border-x sm:border-slate-100 sm:px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Commissioning Date</p>
          <p className="text-lg font-bold text-[#2D3748]">{trackerEta}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
            {projectManager.initials}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Project Manager</p>
            <p className="text-sm font-semibold text-[#2D3748]">{projectManager.name}</p>
          </div>
        </div>
        <a
          href={`tel:${projectManager.phone.replace(/\s+/g, '')}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
          title={`Call ${projectManager.name}`}
        >
          <Phone className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}

function TimelineEventCard({ event, isLast }) {
  const iconConfig = iconMap[event.iconType] || { Icon: ClipboardCheck };

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {!isLast && <span className={`absolute left-5 top-11 bottom-0 w-0.5 ${lineTone[event.status]}`} />}
      <TimelineIcon Icon={iconConfig.Icon} SecondaryIcon={iconConfig.Secondary} status={event.status} />

      <Card className="flex-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#2D3748]">{event.title}</h3>
          <Badge tone={event.status} uppercase />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{event.date}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {event.note}{' '}
          {event.noteLink && (
            <button type="button" className="font-medium text-[#3B82F6] transition hover:underline">
              {event.noteLink}
            </button>
          )}
        </p>
        {event.action && (
          <button
            type="button"
            className="mt-3 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {event.action}
          </button>
        )}
      </Card>
    </div>
  );
}

function ConnectionTracker() {
  return (
    <div className="space-y-6" style={{ color: '#2D3748' }}>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[#2D3748]">Connection Tracking</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Radio className="h-3.5 w-3.5" />
              Live Data
            </span>
            <Badge tone="active" uppercase>
              In Progress
            </Badge>
          </div>
        </div>
      </Card>

      <SummaryPanel />

      <Card className="p-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Milestone Timeline</p>
        <div>
          {timelineEvents.map((event, index) => (
            <TimelineEventCard key={event.id} event={event} isLast={index === timelineEvents.length - 1} />
          ))}
        </div>
      </Card>
    </div>
  );
}

export default ConnectionTracker;
