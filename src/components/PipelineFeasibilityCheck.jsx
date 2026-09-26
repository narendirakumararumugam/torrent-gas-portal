import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Crosshair,
  Eye,
  EyeOff,
  Gauge,
  Layers3,
  MapPin,
  Route,
  ShieldCheck,
  TriangleAlert,
  Users,
  Wrench,
} from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SectionHeading from './common/SectionHeading';
import Card from './common/Card';
import CollapsibleSection from './common/CollapsibleSection';
import {
  DEFAULT_TARGET,
  DOWNSTREAM_CUSTOMERS,
  ROW_SEGMENTS,
  SOURCE_NETWORK,
  buildDamageAssessment,
  buildRouteOptions,
  getRowPermissionState,
} from '../data/pipelineGISNetwork';

const modeOptions = [
  {
    key: 'feasibility',
    label: 'Feasibility',
    icon: Route,
    description: 'Compare the nearest DRS, active pipeline, and tee connection routes.',
  },
  {
    key: 'damage',
    label: 'Pipe Damage',
    icon: TriangleAlert,
    description: 'Click a damaged location and isolate the affected downstream corridor.',
  },
];

function formatDistance(value) {
  return `${value.toFixed(2)} km`;
}

function formatPressure(value) {
  return `${value.toFixed(2)} bar`;
}

function formatFlow(value) {
  return `${Math.round(value).toLocaleString('en-IN')} SCMH`;
}

function toneForStatus(status) {
  if (status === 'PASS') return 'bg-emerald-100 text-emerald-700';
  if (status === 'BORDERLINE') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function createMarkerIcon({ label, color, className = '', badge }) {
  const badgeMarkup = badge ? `<span style="display:block;margin-top:2px;font-size:9px;font-weight:700;letter-spacing:0.08em;opacity:0.9">${badge}</span>` : '';
  return L.divIcon({
    className: '',
    html: `
      <div class="gis-marker ${className}" style="background:${color};">
        <span>${label}</span>
        ${badgeMarkup}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -18],
  });
}

function PipelineFeasibilityCheck() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRefs = useRef({ routes: [], rows: [], sources: [], valves: [], customers: [], points: [] });
  const boundsRef = useRef(null);

  const [mode, setMode] = useState('feasibility');
  const [targetLocation, setTargetLocation] = useState(DEFAULT_TARGET);
  const [damageLocation, setDamageLocation] = useState(null);
  const [targetPickMode, setTargetPickMode] = useState(false);
  const [damagePickMode, setDamagePickMode] = useState(false);
  const [selectedRouteKey, setSelectedRouteKey] = useState('drs');
  const [flowDemand, setFlowDemand] = useState(3200);
  const [minPressure, setMinPressure] = useState(4.0);
  const [diameterMm, setDiameterMm] = useState(160);
  const [material, setMaterial] = useState('PE100');
  const [roughness, setRoughness] = useState(0.007);
  const [gasTemperature, setGasTemperature] = useState(25);
  const [elevationRise, setElevationRise] = useState(0.3);
  const [blinkPhase, setBlinkPhase] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [damageTab, setDamageTab] = useState('isolation');

  const routeOptions = useMemo(
    () =>
      buildRouteOptions(targetLocation, {
        flowDemand,
        minPressure,
        diameterMm,
        material,
        roughness,
        gasTemperature,
        elevationRise,
      }),
    [targetLocation, flowDemand, minPressure, diameterMm, material, roughness, gasTemperature, elevationRise],
  );

  const selectedRoute = routeOptions.find((route) => route.key === selectedRouteKey) || routeOptions[0];
  const damageAssessment = useMemo(() => (damageLocation ? buildDamageAssessment(damageLocation) : null), [damageLocation]);
  const rowSegments = useMemo(() => ROW_SEGMENTS.map((segment) => ({ ...segment, state: getRowPermissionState(segment) })), []);

  useEffect(() => {
    if (!routeOptions.length) return;
    setSelectedRouteKey((current) => (routeOptions.some((route) => route.key === current) ? current : routeOptions[0].key));
  }, [routeOptions]);

  useEffect(() => {
    if (!damageAssessment) return undefined;
    const timer = setInterval(() => setBlinkPhase((current) => !current), 650);
    return () => clearInterval(timer);
  }, [damageAssessment]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([13.08, 80.16], 10);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const handleMapClick = (event) => {
      if (mode === 'feasibility' && targetPickMode) {
        setTargetLocation({ lat: event.latlng.lat, lng: event.latlng.lng, name: 'Selected customer location' });
        setTargetPickMode(false);
        return;
      }

      if (mode === 'damage' && damagePickMode) {
        setDamageLocation({ lat: event.latlng.lat, lng: event.latlng.lng, name: 'Damaged location' });
        setDamagePickMode(false);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      map.remove();
      mapRef.current = null;
    };
  }, [mode, targetPickMode, damagePickMode]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const clearLayers = () => {
      Object.values(layerRefs.current).forEach((layers) => {
        layers.forEach((layer) => layer.remove());
      });
      layerRefs.current = { routes: [], rows: [], sources: [], valves: [], customers: [], points: [] };
    };

    const addLayer = (group, layer) => {
      layerRefs.current[group].push(layer);
      return layer;
    };

    clearLayers();

    rowSegments.forEach((segment) => {
      const rowLayer = addLayer(
        'rows',
        L.polyline(segment.geometry, {
          color: segment.state.tone === 'green' ? '#16a34a' : '#dc2626',
          weight: 6,
          opacity: 0.85,
          dashArray: segment.state.tone === 'green' ? '4 8' : '10 8',
        }).addTo(map),
      );

      rowLayer.bindPopup(
        `<b>${segment.name}</b><br>${segment.state.details}<br>${segment.state.remainingDays !== null ? `${segment.state.remainingDays} days remaining` : segment.state.label}`,
      );
    });

    const sourceGroups = [
      { kind: 'drs', color: '#0f766e', label: 'D' },
      { kind: 'activePipelines', color: '#2563eb', label: 'P' },
      { kind: 'teePoints', color: '#d97706', label: 'T' },
    ];

    sourceGroups.forEach((group) => {
      SOURCE_NETWORK[group.kind].forEach((source) => {
        const activeRoute = selectedRoute && selectedRoute.source.id === source.id;
        const marker = addLayer(
          'sources',
          L.marker([source.lat, source.lng], {
            icon: createMarkerIcon({ label: group.label, color: activeRoute ? '#14532d' : group.color, badge: source.id }),
          }).addTo(map),
        );

        marker.bindPopup(`<b>${source.name}</b><br>Available flow: ${formatFlow(source.availableFlow)}<br>Pressure: ${formatPressure(source.pressure)}`);
        marker.on('click', () => {
          const matchedKey = routeOptions.find((route) => route.source.id === source.id)?.key;
          if (matchedKey) setSelectedRouteKey(matchedKey);
        });
      });
    });

    const targetPoint = addLayer(
      'points',
      L.marker([targetLocation.lat, targetLocation.lng], {
        draggable: true,
        icon: createMarkerIcon({ label: 'C', color: '#db2777', badge: 'TARGET' }),
      }).addTo(map),
    );
    targetPoint.bindPopup(`<b>${targetLocation.name}</b><br>Customer selection point`);
    targetPoint.on('dragend', () => {
      const point = targetPoint.getLatLng();
      setTargetLocation({ lat: point.lat, lng: point.lng, name: 'Selected customer location' });
    });

    if (mode === 'damage' && damageLocation) {
      const damagePoint = addLayer(
        'points',
        L.marker([damageLocation.lat, damageLocation.lng], {
          draggable: true,
          icon: createMarkerIcon({ label: '!', color: '#b91c1c', badge: 'DAMAGE' }),
        }).addTo(map),
      );
      damagePoint.bindPopup('<b>Damaged segment</b><br>Click map to reposition the incident.');
      damagePoint.on('dragend', () => {
        const point = damagePoint.getLatLng();
        setDamageLocation({ lat: point.lat, lng: point.lng, name: 'Damaged location' });
      });
    }

    routeOptions.forEach((route) => {
      const layer = addLayer(
        'routes',
        L.polyline(route.geometry, {
          color: route.key === selectedRoute?.key ? route.color : `${route.color}cc`,
          weight: route.key === selectedRoute?.key ? 8 : 5,
          opacity: route.key === selectedRoute?.key ? 1 : 0.62,
          dashArray: route.key === selectedRoute?.key ? undefined : '10 8',
        }).addTo(map),
      );

      layer.bindPopup(
        `<b>${route.label}</b><br>${formatDistance(route.lengthKm)} total length<br>${formatPressure(route.pressureDrop)} loss<br>${formatPressure(route.endPressure)} at customer`,
      );
      layer.on('click', () => setSelectedRouteKey(route.key));
    });

    if (mode === 'damage' && damageAssessment) {
      const damagePointLayer = addLayer(
        'points',
        L.circleMarker([damageLocation.lat, damageLocation.lng], {
          radius: 10,
          color: '#991b1b',
          fillColor: '#ef4444',
          fillOpacity: 0.55,
          weight: 3,
        }).addTo(map),
      );
      damagePointLayer.bindPopup('<b>Incident focus</b><br>Damage impact analysis active.');

      DOWNSTREAM_CUSTOMERS.forEach((customer) => {
        const affected = customer.order >= damageAssessment.damageOrder;
        const marker = addLayer(
          'customers',
          L.marker([customer.lat, customer.lng], {
            icon: createMarkerIcon({
              label: 'C',
              color: affected ? '#dc2626' : '#16a34a',
              badge: `${customer.order}`,
              className: affected ? '' : 'gis-marker--muted',
            }),
          }).addTo(map),
        );

        marker.bindPopup(
          `<b>${customer.name}</b><br>${customer.industry}<br>${affected ? 'Affected downstream customer' : 'Unaffected downstream customer'}<br>Chainage order: ${customer.order}`,
        );
      });

      damageAssessment.isolationValves.forEach((valve) => {
        const valveMarker = addLayer(
          'valves',
          L.marker([valve.lat, valve.lng], {
            icon: createMarkerIcon({ label: 'V', color: '#0f172a', badge: valve.id, className: blinkPhase ? 'gis-valve-blink' : '' }),
          }).addTo(map),
        );
        valveMarker.bindPopup(`<b>${valve.name}</b><br>Close immediately to isolate the damaged segment.`);
      });
    }

    const boundsPoints = [];
    if (selectedRoute) boundsPoints.push(...selectedRoute.geometry);
    boundsPoints.push([targetLocation.lat, targetLocation.lng]);
    if (damageLocation) boundsPoints.push([damageLocation.lat, damageLocation.lng]);

    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      boundsRef.current = bounds;
      map.fitBounds(bounds, { padding: [36, 36] });
    }

    return () => {
      clearLayers();
    };
  }, [mode, rowSegments, routeOptions, selectedRoute, targetLocation, damageLocation, damageAssessment, blinkPhase]);

  const selectedSource = selectedRoute?.source;
  const handleRecenter = () => {
    if (mapRef.current && boundsRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [36, 36] });
    }
  };
  const rowSummary = rowSegments.reduce(
    (summary, segment) => {
      if (segment.state.tone === 'green') summary.active += 1;
      else summary.blocked += 1;
      return summary;
    },
    { active: 0, blocked: 0 },
  );

  const damageStats = damageAssessment
    ? [
        { label: 'Downstream affected', value: damageAssessment.summary.affectedCount, detail: 'Customers that require outage planning.', icon: AlertTriangle },
        { label: 'Unaffected downstream', value: damageAssessment.summary.unaffectedCount, detail: 'Customers outside the isolated section.', icon: Building2 },
        { label: 'Isolation valves', value: damageAssessment.isolationValves.length, detail: 'Blinking on the map for immediate closure.', icon: Wrench },
        { label: 'Response state', value: 'Active', detail: 'Impact analysis refreshed instantly on map click.', icon: ShieldCheck },
      ]
    : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="GIS Pipeline Route Feasibility & Emergency Management"
        description="Operator workflow for industrial customer onboarding, route comparison, right-of-way visibility, and immediate damage isolation planning."
      />

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <div className="space-y-4">
          <Card className="p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              {modeOptions.map((option) => {
                const active = mode === option.key;
                const Icon = option.icon;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setMode(option.key);
                      setTargetPickMode(false);
                      setDamagePickMode(false);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="px-3 pb-2 pt-2.5 text-xs leading-5 text-slate-500">
              {modeOptions.find((option) => option.key === mode)?.description}
            </p>
          </Card>

          {mode === 'feasibility' ? (
            <>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Target customer location</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{targetLocation.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Click the map to move the customer site or drag the marker directly.</p>
                  </div>
                  <MapPin className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  onClick={() => setTargetPickMode(true)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${targetPickMode ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'}`}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {targetPickMode ? 'Click map to place customer' : 'Select customer on map'}
                </button>
              </Card>

              <CollapsibleSection
                title="Hydraulic parameters"
                subtitle={`${flowDemand.toLocaleString('en-IN')} SCMH · ${diameterMm}mm ${material} · min ${minPressure.toFixed(1)} bar`}
                icon={Gauge}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Peak gas demand
                    <input
                      type="number"
                      value={flowDemand}
                      onChange={(event) => setFlowDemand(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Minimum pressure
                    <input
                      type="number"
                      step="0.1"
                      value={minPressure}
                      onChange={(event) => setMinPressure(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pipe diameter
                    <input
                      type="number"
                      value={diameterMm}
                      onChange={(event) => setDiameterMm(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pipe material
                    <select
                      value={material}
                      onChange={(event) => setMaterial(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    >
                      <option>PE100</option>
                      <option>PE80</option>
                      <option>Steel</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Roughness
                    <input
                      type="number"
                      step="0.001"
                      value={roughness}
                      onChange={(event) => setRoughness(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Gas temperature
                    <input
                      type="number"
                      value={gasTemperature}
                      onChange={(event) => setGasTemperature(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Elevation rise
                    <input
                      type="number"
                      step="0.1"
                      value={elevationRise}
                      onChange={(event) => setElevationRise(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Right-of-way permissions"
                subtitle={`${rowSummary.active} active · ${rowSummary.blocked} pending/blocked`}
                icon={Layers3}
                badge={
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${rowSummary.blocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {rowSummary.blocked ? `${rowSummary.blocked} blocked` : 'All clear'}
                  </span>
                }
              >
                <div className="space-y-2">
                  {rowSegments.map((segment) => (
                    <div key={segment.id} className={`rounded-2xl border p-3.5 ${segment.state.tone === 'green' ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{segment.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Authority: {segment.authority}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${segment.state.tone === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {segment.state.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{segment.state.details}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Active ROW segments</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{rowSummary.active}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pending / unavailable</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{rowSummary.blocked}</p>
                  </div>
                </div>
              </CollapsibleSection>

              <div className="space-y-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Route comparison</p>
                {routeOptions.map((route) => {
                  const active = route.key === selectedRoute?.key;
                  return (
                    <button
                      key={route.key}
                      type="button"
                      onClick={() => setSelectedRouteKey(route.key)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{route.label}</p>
                          <p className="mt-1 text-xs text-slate-500">Nearest source: {route.source.name}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneForStatus(route.status)}`}>{route.status}</span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Source distance</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDistance(route.sourceDistanceKm)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Route length</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDistance(route.lengthKm)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pressure loss</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatPressure(route.pressureDrop)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">End pressure</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatPressure(route.endPressure)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">{route.rowClearance}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">Max flow {formatFlow(route.availableFlow)}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">Pipe routing: source → target</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Pipe damage response</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Click the map to mark the damage location</h3>
                    <p className="mt-1 text-sm text-slate-500">The impact analysis updates instantly and the isolation valves blink on the map.</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-rose-600" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  onClick={() => setDamagePickMode(true)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${damagePickMode ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'}`}
                >
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  {damagePickMode ? 'Click map to place damage' : 'Mark damaged pipe on map'}
                </button>

                {damageLocation && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    Damage point captured at {damageLocation.lat.toFixed(4)}, {damageLocation.lng.toFixed(4)}. Isolation valves are now blinking.
                  </div>
                )}
              </Card>

              {damageAssessment && (
                <Card className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Impact snapshot</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {damageStats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] uppercase leading-4 tracking-[0.14em] text-slate-400">{item.label}</p>
                            <Icon className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
                          </div>
                          <p className="mt-1.5 text-xl font-semibold text-slate-900">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {damageAssessment && (
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                    {[
                      { key: 'isolation', label: 'Isolation', count: damageAssessment.isolationValves.length },
                      { key: 'affected', label: 'Affected', count: damageAssessment.affectedCustomers.length },
                      { key: 'unaffected', label: 'Unaffected', count: damageAssessment.unaffectedCustomers.length },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDamageTab(tab.key)}
                        className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${damageTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {tab.label} · {tab.count}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    {damageTab === 'isolation' &&
                      damageAssessment.isolationValves.map((valve) => (
                        <div key={valve.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{valve.name}</p>
                              <p className="mt-1 text-xs text-slate-500">Chainage order {valve.order}</p>
                            </div>
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Blinking</span>
                          </div>
                        </div>
                      ))}

                    {damageTab === 'affected' &&
                      damageAssessment.affectedCustomers.map((customer) => (
                        <div key={customer.contractNumber} className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{customer.industry} · {customer.location} · order {customer.order}</p>
                        </div>
                      ))}

                    {damageTab === 'unaffected' &&
                      damageAssessment.unaffectedCustomers.map((customer) => (
                        <div key={customer.contractNumber} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{customer.industry} · {customer.location} · order {customer.order}</p>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card className="relative overflow-hidden p-0">
            <div className="absolute left-4 top-4 z-[500] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Operator login</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Marketing module GIS control room</p>
            </div>

            <div className="absolute right-4 top-4 z-[500] flex gap-2">
              <button
                type="button"
                onClick={handleRecenter}
                title="Recenter map"
                className="rounded-xl bg-white/95 p-2.5 text-slate-600 shadow-lg backdrop-blur transition hover:text-emerald-700"
              >
                <Crosshair className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setLegendOpen((current) => !current)}
                title={legendOpen ? 'Hide legend' : 'Show legend'}
                className="rounded-xl bg-white/95 p-2.5 text-slate-600 shadow-lg backdrop-blur transition hover:text-emerald-700"
              >
                {legendOpen ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>

            {legendOpen && (
              <div className="absolute bottom-4 left-4 z-[500] rounded-xl bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur">
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Active ROW</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Pending / unavailable ROW</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />Nearest DRS</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />Active pipeline</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />Tap-off / tee</span>
                </div>
              </div>
            )}

            <div ref={mapContainerRef} className="min-h-[720px] w-full" />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected source</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedSource?.name || 'No route selected'}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedRoute ? selectedRoute.rationale : 'Choose a route option to inspect it on the map.'}</p>
                </div>
                <Building2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Source network</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{SOURCE_NETWORK.drs.length + SOURCE_NETWORK.activePipelines.length + SOURCE_NETWORK.teePoints.length} options mapped</p>
                  <p className="mt-1 text-sm text-slate-500">DRS, active pipeline, and tee points are available as selectable origins.</p>
                </div>
                <Wrench className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
            </Card>
          </div>

          <CollapsibleSection
            title="Downstream customer corridor"
            subtitle={`${DOWNSTREAM_CUSTOMERS.length} industrial customers along the chainage`}
            icon={Users}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {DOWNSTREAM_CUSTOMERS.map((customer) => (
                <div key={customer.contractNumber} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{customer.industry} · {customer.location}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Order {customer.order}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

export default PipelineFeasibilityCheck;