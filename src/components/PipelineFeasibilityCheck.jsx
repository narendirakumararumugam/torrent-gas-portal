import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Crosshair,
  Droplets,
  Eye,
  EyeOff,
  Gauge,
  Layers3,
  MapPin,
  Route,
  ShieldCheck,
  Send,
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
  ALL_CHAMBERS,
  CUSTOMERS,
  DEFAULT_TARGET,
  INTERNAL_ALERT_TEAM,
  MAP_CENTER,
  NODES,
  PRESSURE_ALERT_THRESHOLD_BAR,
  SEGMENTS,
  buildConnectionOptions,
  buildDrsCapacityProjection,
  buildIsolationAssessment,
  ensureRoadSnappedNetwork,
  getCustomerPressureStatuses,
  getDrsLoadSummary,
  hydraulicStatus,
  pressureDropBar,
} from '../data/pipelineGISNetwork';

const modeOptions = [
  {
    key: 'feasibility',
    label: 'New Connection',
    icon: Route,
    description: 'Click a new customer coordinate to compare a valve-chamber tap-off against a direct pipeline hot-tap.',
  },
  {
    key: 'isolation',
    label: 'Isolation / Damage',
    icon: TriangleAlert,
    description: 'Click a pipeline segment or a customer point to simulate maintenance or damage isolation.',
  },
  {
    key: 'pressure',
    label: 'Pressure Status',
    icon: Gauge,
    description: `Live terminal pressure for every connected customer, calculated from real pipeline distance. Anyone below ${PRESSURE_ALERT_THRESHOLD_BAR.toFixed(1)} bar triggers a WhatsApp + email alert to the internal team.`,
  },
];

function formatDistance(value) {
  return `${value.toFixed(2)} km`;
}

function formatPressure(value) {
  return `${value.toFixed(2)} bar`;
}

function formatVolume(value) {
  return `${value.toLocaleString('en-IN')} SCMD`;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

async function fetchRoadRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?alternatives=false&overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Routing request failed');

    const result = await response.json();
    const route = result.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error('No road route returned');

    return {
      geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      source: 'osrm',
    };
  } catch {
    return {
      geometry: [from, to],
      distanceKm: Math.sqrt((from.lat - to.lat) ** 2 + (from.lng - to.lng) ** 2) * 111,
      source: 'fallback',
    };
  }
}

function toneForStatus(status) {
  if (status === 'PASS') return 'bg-emerald-100 text-emerald-700';
  if (status === 'BORDERLINE') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function toneForPermission(status) {
  return status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
}

function formatFeasibilityStatus(option) {
  return `${option.status} · ${option.recommendedDiameterMm} mm MDPE`;
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

function PipelineFeasibilityCheck({ onShowToast }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRefs = useRef({ routes: [], rows: [], sources: [], valves: [], customers: [], points: [] });
  const routeLayersRef = useRef([]);
  const boundsRef = useRef(null);
  const autoAlertedRef = useRef(new Set());

  const [mode, setMode] = useState('feasibility');
  const [targetLocation, setTargetLocation] = useState(DEFAULT_TARGET);
  const [damageLocation, setDamageLocation] = useState(null);
  const [targetPickMode, setTargetPickMode] = useState(false);
  const [damagePickMode, setDamagePickMode] = useState(false);
  const [selectedOptionKey, setSelectedOptionKey] = useState('optionA');
  const [routeSnapshots, setRouteSnapshots] = useState({ optionA: null, optionB: null, loading: false, source: 'fallback' });
  const [flowScmh, setFlowScmh] = useState(300);
  const [newCustomerDailyVolumeScmd, setNewCustomerDailyVolumeScmd] = useState(5000);
  const [drsPressureBar, setDrsPressureBar] = useState(4);
  const [minPressureBar, setMinPressureBar] = useState(1.5);
  const [material, setMaterial] = useState('PE100');
  const [roughness, setRoughness] = useState(0.007);
  const [gasTemperature, setGasTemperature] = useState(25);
  const [elevationRiseM, setElevationRiseM] = useState(0.3);
  const [legendOpen, setLegendOpen] = useState(true);
  const [isolationTab, setIsolationTab] = useState('valves');
  const [customerMessage, setCustomerMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState(null);
  const [sentMessageSummary, setSentMessageSummary] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [networkReady, setNetworkReady] = useState(false);
  const [scenarioDrsPressureBar, setScenarioDrsPressureBar] = useState(NODES.DRS_1.pressureBar);
  const [demandMultiplier, setDemandMultiplier] = useState(1);
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(true);
  const [alertLog, setAlertLog] = useState([]);

  const connectionOptions = useMemo(
    () => buildConnectionOptions(targetLocation, { flowScmh, drsPressureBar, minPressureBar, material, roughness, gasTemperature, elevationRiseM }),
    [targetLocation, flowScmh, drsPressureBar, minPressureBar, material, roughness, gasTemperature, elevationRiseM, networkReady],
  );
  const selectedOption = connectionOptions[selectedOptionKey];
  const isolationAssessment = useMemo(() => (damageLocation ? buildIsolationAssessment(damageLocation) : null), [damageLocation, networkReady]);

  const drsLoadSummary = useMemo(() => getDrsLoadSummary('DRS_1'), []);
  const capacityProjection = useMemo(
    () => buildDrsCapacityProjection('DRS_1', newCustomerDailyVolumeScmd, flowScmh),
    [newCustomerDailyVolumeScmd, flowScmh],
  );
  const pressureStatuses = useMemo(
    () => getCustomerPressureStatuses({ drsPressureBar: scenarioDrsPressureBar, demandMultiplier }),
    [scenarioDrsPressureBar, demandMultiplier],
  );
  const lowPressureCustomers = useMemo(() => pressureStatuses.filter((customer) => customer.belowAlertThreshold), [pressureStatuses]);

  const handleSendPressureAlert = (customer, channel) => {
    const entry = {
      id: `${customer.id}-${channel}-${Date.now()}`,
      customerName: customer.name,
      channel,
      trigger: 'Manual',
      pressureBar: customer.actualPressureBar,
      sentAt: new Date().toLocaleString('en-IN'),
    };
    setAlertLog((current) => [entry, ...current]);
    onShowToast?.(`${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} alert sent to ${INTERNAL_ALERT_TEAM.name} for ${customer.name} (${formatPressure(customer.actualPressureBar)}).`);
  };

  useEffect(() => {
    const currentIds = new Set(lowPressureCustomers.map((customer) => customer.id));
    autoAlertedRef.current.forEach((id) => {
      if (!currentIds.has(id)) autoAlertedRef.current.delete(id);
    });

    if (!autoAlertEnabled) return;

    lowPressureCustomers.forEach((customer) => {
      if (autoAlertedRef.current.has(customer.id)) return;
      autoAlertedRef.current.add(customer.id);

      const sentAt = new Date().toLocaleString('en-IN');
      setAlertLog((current) => [
        { id: `${customer.id}-whatsapp-auto-${Date.now()}`, customerName: customer.name, channel: 'whatsapp', trigger: 'Automatic', pressureBar: customer.actualPressureBar, sentAt },
        { id: `${customer.id}-email-auto-${Date.now()}`, customerName: customer.name, channel: 'email', trigger: 'Automatic', pressureBar: customer.actualPressureBar, sentAt },
        ...current,
      ]);
      onShowToast?.(`Auto-alert: WhatsApp + email sent to ${INTERNAL_ALERT_TEAM.name} for ${customer.name} (${formatPressure(customer.actualPressureBar)}).`);
    });
  }, [lowPressureCustomers, autoAlertEnabled]);

  const isolationIncidentKey = isolationAssessment?.incidentLabel || '';

  useEffect(() => {
    setCustomerMessage('');
    setMessageStatus(null);
    setSentMessageSummary(null);
  }, [isolationIncidentKey]);

  const handleSendCustomerMessage = () => {
    if (!isolationAssessment?.impactedCustomers.length || !customerMessage.trim()) return;

    const recipients = isolationAssessment.impactedCustomers.map((customer) => customer.name).join(', ');
    setSentMessageSummary({
      recipients,
      message: customerMessage.trim(),
      sentAt: new Date().toLocaleString('en-IN'),
    });
    setMessageStatus('sent');
    setCustomerMessage('');
  };

  const resolvedConnectionOptions = useMemo(() => {
    const resolveOption = (option, routeSnapshot) => {
      const routeGeometry = routeSnapshot?.geometry ?? [option.tapPoint, targetLocation];
      const routeDistanceKm = routeSnapshot?.distanceKm ?? option.distanceKm;
      const pressureLoss = pressureDropBar({
        distanceKm: routeDistanceKm,
        diameterMm: option.recommendedDiameterMm,
        flowScmh,
        material,
        roughness,
        gasTemperature,
        elevationRiseM,
      });
      const terminalPressure = round2(option.startPressureBar - pressureLoss);

      return {
        ...option,
        distanceKm: round2(routeDistanceKm),
        pressureDropBar: pressureLoss,
        terminalPressureBar: terminalPressure,
        status: hydraulicStatus(terminalPressure, minPressureBar),
        routeGeometry,
        routeSource: routeSnapshot?.source ?? 'estimate',
      };
    };

    return {
      optionA: resolveOption(connectionOptions.optionA, routeSnapshots.optionA),
      optionB: resolveOption(connectionOptions.optionB, routeSnapshots.optionB),
    };
  }, [connectionOptions, flowScmh, gasTemperature, elevationRiseM, material, minPressureBar, roughness, routeSnapshots, targetLocation]);

  const selectedResolvedOption = resolvedConnectionOptions[selectedOptionKey];

  useEffect(() => {
    if (mode !== 'feasibility') {
      setRouteSnapshots({ optionA: null, optionB: null, loading: false, source: 'fallback' });
      return undefined;
    }

    let cancelled = false;

    const loadRoutes = async () => {
      setRouteSnapshots((current) => ({ ...current, loading: true }));
      const [optionA, optionB] = await Promise.all([
        fetchRoadRoute(connectionOptions.optionA.tapPoint, targetLocation),
        fetchRoadRoute(connectionOptions.optionB.tapPoint, targetLocation),
      ]);

      if (cancelled) return;

      setRouteSnapshots({ optionA, optionB, loading: false, source: optionA.source === 'osrm' && optionB.source === 'osrm' ? 'osrm' : 'fallback' });
    };

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [connectionOptions.optionA.tapPoint, connectionOptions.optionB.tapPoint, mode, targetLocation]);

  useEffect(() => {
    let cancelled = false;

    const loadRoadSnappedNetwork = async () => {
      await ensureRoadSnappedNetwork();
      if (!cancelled) setNetworkReady(true);
    };

    loadRoadSnappedNetwork();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([MAP_CENTER.lat, MAP_CENTER.lng], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const handleMapClick = (event) => {
      if (mode === 'feasibility' && targetPickMode) {
        setTargetLocation({ lat: event.latlng.lat, lng: event.latlng.lng, name: 'Selected customer coordinates' });
        setTargetPickMode(false);
        return;
      }

      if (mode === 'isolation' && damagePickMode) {
        setDamageLocation({ lat: event.latlng.lat, lng: event.latlng.lng, name: 'Incident location' });
        setDamagePickMode(false);
      }
    };

    map.on('click', handleMapClick);
    setMapReady(true);

    return () => {
      map.off('click', handleMapClick);
      map.remove();
      mapRef.current = null;
      routeLayersRef.current.forEach((layer) => layer.remove());
      routeLayersRef.current = [];
      setMapReady(false);
    };
  }, [mode, targetPickMode, damagePickMode]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const clearLayers = () => {
      Object.values(layerRefs.current).forEach((layers) => {
        layers.forEach((layer) => layer.remove());
      });
      layerRefs.current = { routes: [], rows: [], sources: [], valves: [], customers: [], points: [] };
      routeLayersRef.current.forEach((layer) => layer.remove());
      routeLayersRef.current = [];
    };

    const addLayer = (group, layer) => {
      layerRefs.current[group].push(layer);
      return layer;
    };

    clearLayers();

    if (networkReady) {
      SEGMENTS.forEach((segment) => {
        const isActive = segment.permission.status === 'active';
        const layer = addLayer(
          'rows',
          L.polyline(segment.geometry, {
            color: isActive ? '#16a34a' : '#dc2626',
            weight: 6,
            opacity: 0.85,
            dashArray: isActive ? undefined : '10 8',
          }).addTo(map),
        );
        layer.bindPopup(`<b>${segment.id} · ${segment.name}</b><br>${segment.pipeSpecMm}mm MDPE · ${segment.lengthKm} km<br>${segment.permission.note}`);
      });
    }

    Object.values(NODES).forEach((node) => {
      const marker = addLayer(
        'sources',
        L.marker([node.lat, node.lng], {
          icon: createMarkerIcon({ label: node.id === 'CGS' ? 'G' : 'D', color: node.id === 'CGS' ? '#0f172a' : '#0f766e', badge: node.id.replace('_', '-') }),
        }).addTo(map),
      );
      marker.bindPopup(`<b>${node.name}</b><br>Pressure: ${formatPressure(node.pressureBar)}`);
    });

    ALL_CHAMBERS.forEach((chamber) => {
      const isBlinking = mode === 'isolation' && isolationAssessment?.isolationValves.some((valve) => valve.id === chamber.id);
      // Nudge the marker away from an exactly co-located customer tap so both stay visible.
      const isCustomerTap = CUSTOMERS.some((customer) => customer.valveChamberId === chamber.id);
      const displayLat = isCustomerTap ? chamber.lat + 0.00045 : chamber.lat;
      const displayLng = isCustomerTap ? chamber.lng - 0.00045 : chamber.lng;
      const marker = addLayer(
        'valves',
        L.marker([displayLat, displayLng], {
          icon: createMarkerIcon({ label: 'V', color: '#475569', badge: chamber.id, className: isBlinking ? 'gis-valve-blink' : '' }),
        }).addTo(map),
      );
      marker.bindPopup(`<b>${chamber.name}</b>`);
    });

    CUSTOMERS.forEach((customer) => {
      const impacted = isolationAssessment?.impactedCustomers.some((item) => item.id === customer.id);
      const pressureInfo = pressureStatuses.find((item) => item.id === customer.id);
      const tone = mode === 'isolation' && isolationAssessment
        ? (impacted ? '#dc2626' : '#16a34a')
        : mode === 'pressure'
          ? (pressureInfo?.belowAlertThreshold ? '#dc2626' : '#16a34a')
          : '#334155';
      const marker = addLayer(
        'customers',
        L.marker([customer.lat, customer.lng], {
          icon: createMarkerIcon({ label: 'C', color: tone, badge: `${(customer.dailyVolumeScmd / 1000).toFixed(1)}k`, className: impacted || (mode === 'pressure' && pressureInfo?.belowAlertThreshold) ? 'gis-valve-blink' : '' }),
        }).addTo(map),
      );
      marker.bindPopup(
        `<b>${customer.name}</b><br>${customer.location}<br>${formatVolume(customer.dailyVolumeScmd)} · ${customer.peakFlowScmh} SCMH peak · required ${customer.requiredPressureBar} bar<br>Actual pressure: ${formatPressure(pressureInfo?.actualPressureBar ?? customer.requiredPressureBar)}<br>Valve chamber: ${customer.valveChamberId}`,
      );
      if (mode === 'isolation') {
        marker.on('click', () => setDamageLocation({ lat: customer.lat, lng: customer.lng, name: `${customer.name} service line` }));
      }
    });

    if (mode === 'feasibility') {
      const targetMarker = addLayer(
        'points',
        L.marker([targetLocation.lat, targetLocation.lng], {
          draggable: true,
          icon: createMarkerIcon({ label: 'N', color: '#db2777', badge: 'NEW' }),
        }).addTo(map),
      );
      targetMarker.bindPopup(`<b>${targetLocation.name}</b><br>Proposed customer coordinates`);
      targetMarker.on('dragend', () => {
        const point = targetMarker.getLatLng();
        setTargetLocation({ lat: point.lat, lng: point.lng, name: 'Selected customer coordinates' });
      });

      routeLayersRef.current.forEach((layer) => layer.remove());
      routeLayersRef.current = [];

      [resolvedConnectionOptions.optionA, resolvedConnectionOptions.optionB].forEach((option) => {
        const isSelected = option.key === selectedOptionKey;
        const routeColor = option.key === 'optionA' ? '#16a34a' : '#2563eb';
        const routeLayer = addLayer(
          'routes',
          L.polyline(
            option.routeGeometry.map((point) => [point.lat, point.lng]),
            {
              color: routeColor,
              weight: isSelected ? 7 : 4,
              opacity: isSelected ? 1 : 0.7,
              dashArray: option.key === 'optionB' ? '4 7' : undefined,
            },
          ).addTo(map),
        );
        routeLayer.bindPopup(
          `<b>${option.label}</b><br>${routeSnapshots.source === 'osrm' ? 'Snapped to road network via OSRM' : 'Corridor estimate fallback'}<br>Route length ${formatDistance(option.distanceKm)}`,
        );
        routeLayer.on('click', () => setSelectedOptionKey(option.key));
        routeLayersRef.current.push(routeLayer);
      });

      if (routeSnapshots.loading) {
        const loadingLayer = addLayer(
          'points',
          L.marker([targetLocation.lat, targetLocation.lng], {
            icon: createMarkerIcon({ label: 'R', color: '#0f172a', badge: 'ROUTE' }),
          }).addTo(map),
        );
        loadingLayer.bindPopup('<b>Routing</b><br>Snapping to the road network...');
      }
    }

    if (mode === 'isolation' && damageLocation) {
      const damagePoint = addLayer(
        'points',
        L.circleMarker([damageLocation.lat, damageLocation.lng], {
          radius: 10,
          color: '#991b1b',
          fillColor: '#ef4444',
          fillOpacity: 0.55,
          weight: 3,
        }).addTo(map),
      );
      damagePoint.bindPopup(`<b>Incident focus</b><br>${damageLocation.name}`);
    }

    const boundsPoints = [];
    if (networkReady) {
      SEGMENTS.forEach((segment) => boundsPoints.push(...segment.geometry));
    }
    if (mode === 'feasibility') boundsPoints.push([targetLocation.lat, targetLocation.lng]);
    if (mode === 'isolation' && damageLocation) boundsPoints.push([damageLocation.lat, damageLocation.lng]);
    if (mode === 'feasibility') {
      [resolvedConnectionOptions.optionA, resolvedConnectionOptions.optionB].forEach((option) => {
        option.routeGeometry.forEach((point) => boundsPoints.push([point.lat, point.lng]));
      });
    }

    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      boundsRef.current = bounds;
      if (!targetPickMode && !damagePickMode) map.fitBounds(bounds, { padding: [36, 36] });
    }

    return () => {
      clearLayers();
    };
  }, [mapReady, networkReady, mode, resolvedConnectionOptions, routeSnapshots.loading, selectedOptionKey, targetLocation, damageLocation, isolationAssessment, targetPickMode, damagePickMode, pressureStatuses]);

  const handleRecenter = () => {
    if (mapRef.current && boundsRef.current) {
      mapRef.current.fitBounds(boundsRef.current, { padding: [36, 36] });
    }
  };

  const permissionSummary = SEGMENTS.reduce(
    (summary, segment) => {
      if (segment.permission.status === 'active') summary.active += 1;
      else summary.pending += 1;
      return summary;
    },
    { active: 0, pending: 0 },
  );

  const totalLostScmd = isolationAssessment ? isolationAssessment.impactedCustomers.reduce((sum, customer) => sum + customer.lostVolumeScmd, 0) : 0;
  const isolationStats = isolationAssessment
    ? [
        { label: 'Valves to close', value: isolationAssessment.isolationValves.length, detail: 'Blinking on the map for immediate closure.', icon: Wrench },
        { label: 'Customers impacted', value: isolationAssessment.impactedCustomers.length, detail: 'Require outage planning / advance notice.', icon: AlertTriangle },
        { label: 'Affected customer volume', value: formatVolume(totalLostScmd), detail: 'Combined SCMD across impacted customers.', icon: Droplets },
        { label: 'Customers unaffected', value: isolationAssessment.unaffectedCustomers.length, detail: 'No pressure degradation expected.', icon: ShieldCheck },
      ]
    : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Marketing"
        title="Gummidipoondi Pipeline Feasibility & Isolation Analysis"
        description="Point-and-click connection feasibility and emergency isolation planning for the Gummidipoondi Industrial Area distribution network."
      />

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <div className="space-y-4">
          <Card className="p-1.5">
            <div className="grid grid-cols-3 gap-1.5">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">New customer coordinates</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{targetLocation.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Click anywhere on the map to place the new connection, or drag the marker directly.</p>
                    {!networkReady && <p className="mt-2 text-xs font-semibold text-amber-700">Snapping existing network segments to the road service...</p>}
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

              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">DRS load & remaining capacity</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{NODES.DRS_1.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Calculated from the {drsLoadSummary.customerCount} customers already tapped off this DRS over the installed MDPE network.</p>
                  </div>
                  <Gauge className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Existing DRS load</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatVolume(drsLoadSummary.existingLoadScmd)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{drsLoadSummary.existingLoadScmh} SCMH peak · {drsLoadSummary.utilizationScmdPercent}% of capacity</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-600">New customer load</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">{formatVolume(capacityProjection.newLoadScmd)}</p>
                    <p className="mt-1 text-[11px] text-emerald-600">{capacityProjection.newLoadScmh} SCMH peak added</p>
                  </div>
                  <div className={`rounded-xl p-3 ${capacityProjection.withinCapacity ? 'bg-amber-50' : 'bg-rose-50'}`}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">DRS load after addition</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatVolume(capacityProjection.projectedLoadScmd)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{capacityProjection.projectedUtilizationScmdPercent}% of capacity</p>
                  </div>
                  <div className={`rounded-xl p-3 ${capacityProjection.withinCapacity ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Remaining capacity after addition</p>
                    <p className={`mt-1 text-sm font-semibold ${capacityProjection.withinCapacity ? 'text-emerald-700' : 'text-rose-700'}`}>{formatVolume(capacityProjection.remainingAfterScmd)}</p>
                    <p className="mt-1 text-[11px] text-slate-400">of {formatVolume(drsLoadSummary.capacityScmd)} total DRS capacity</p>
                  </div>
                </div>

                {!capacityProjection.withinCapacity && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Adding this customer exceeds {NODES.DRS_1.name}'s rated capacity - a DRS upgrade or load rebalancing is required.
                  </p>
                )}
              </Card>

              <CollapsibleSection
                title="Hydraulic parameters"
                subtitle={`${flowScmh.toLocaleString('en-IN')} SCMH peak · min ${minPressureBar.toFixed(1)} bar`}
                icon={Gauge}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Peak flow rate
                    <input
                      type="number"
                      value={flowScmh}
                      onChange={(event) => setFlowScmh(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Daily volume (new customer)
                    <input
                      type="number"
                      value={newCustomerDailyVolumeScmd}
                      onChange={(event) => setNewCustomerDailyVolumeScmd(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    DRS pressure
                    <input
                      type="number"
                      step="0.1"
                      value={drsPressureBar}
                      onChange={(event) => setDrsPressureBar(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Minimum terminal pressure
                    <input
                      type="number"
                      step="0.1"
                      value={minPressureBar}
                      onChange={(event) => setMinPressureBar(Number(event.target.value))}
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
                      value={elevationRiseM}
                      onChange={(event) => setElevationRiseM(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-600"
                    />
                  </label>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title={`Segment permissions (${SEGMENTS[0].id} to ${SEGMENTS[SEGMENTS.length - 1].id})`}
                subtitle={`${permissionSummary.active} available · ${permissionSummary.pending} pending`}
                icon={Layers3}
                badge={
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${permissionSummary.pending ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {permissionSummary.pending ? `${permissionSummary.pending} pending` : 'All clear'}
                  </span>
                }
              >
                <div className="space-y-2">
                  {SEGMENTS.map((segment) => (
                    <div key={segment.id} className={`rounded-2xl border p-3.5 ${segment.permission.status === 'active' ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{segment.id} · {segment.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{segment.pipeSpecMm}mm MDPE · {segment.lengthKm} km</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneForPermission(segment.permission.status)}`}>
                          {segment.permission.status === 'active' ? 'Available' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{segment.permission.note}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <div className="space-y-3">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Connection options</p>
                {[resolvedConnectionOptions.optionA, resolvedConnectionOptions.optionB].map((option) => {
                  const active = option.key === selectedOptionKey;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedOptionKey(option.key)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                          <p className="mt-1 text-xs text-slate-500">Tap point: {option.tapPointName}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneForStatus(option.status)}`}>{formatFeasibilityStatus(option)}</span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Route length</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDistance(option.distanceKm)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">MDPE feasibility size</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{option.recommendedDiameterMm} mm MDPE</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Pressure loss</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatPressure(option.pressureDropBar)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Terminal pressure</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatPressure(option.terminalPressureBar)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <span className={`rounded-full px-2.5 py-1 ${option.routeSource === 'osrm' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {option.routeSource === 'osrm' ? 'Road-snapped route' : 'Corridor estimate'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          {option.routeGeometry.length} path points
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {option.overlay.map((piece) => (
                          <div key={piece.key} className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${piece.tone === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${piece.tone === 'green' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {piece.label}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
                <p className="px-1 text-[11px] text-slate-400">
                  Routes are snapped to the road network with OSRM. If the service is unavailable, the screen falls back to a corridor estimate.
                </p>
              </div>
            </>
          ) : mode === 'isolation' ? (
            <>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Isolation / damage response</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Click a segment or customer to simulate isolation</h3>
                    <p className="mt-1 text-sm text-slate-500">Click anywhere on a feeder pipe (or a customer marker) to find the nearest upstream and downstream valve chambers to close - both the valves and the affected customer blink on the map.</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-rose-600" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  onClick={() => setDamagePickMode(true)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${damagePickMode ? 'border-rose-600 bg-rose-600 text-white' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'}`}
                >
                  <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                  {damagePickMode ? 'Click map to place incident' : 'Mark damage / maintenance on map'}
                </button>

                {isolationAssessment && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <p className="font-semibold">Incident: {isolationAssessment.incidentLabel}</p>
                    <p className="mt-1">{isolationAssessment.actionSummary}</p>
                  </div>
                )}
              </Card>

              {isolationAssessment && (
                <Card className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Impact snapshot</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {isolationStats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] uppercase leading-4 tracking-[0.14em] text-slate-400">{item.label}</p>
                            <Icon className="h-3.5 w-3.5 shrink-0 text-rose-600" aria-hidden="true" />
                          </div>
                          <p className="mt-1.5 text-lg font-semibold text-slate-900">{item.value}</p>
                          <p className="mt-1 text-[11px] leading-4 text-slate-500">{item.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {isolationAssessment && (
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
                    {[
                      { key: 'valves', label: 'Valves', count: isolationAssessment.isolationValves.length },
                      { key: 'impacted', label: 'Impacted', count: isolationAssessment.impactedCustomers.length },
                      { key: 'unaffected', label: 'Unaffected', count: isolationAssessment.unaffectedCustomers.length },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setIsolationTab(tab.key)}
                        className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${isolationTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {tab.label} · {tab.count}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    {isolationTab === 'valves' &&
                      isolationAssessment.isolationValves.map((valve) => (
                        <div key={valve.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{valve.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{valve.note}</p>
                            </div>
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Close now</span>
                          </div>
                        </div>
                      ))}

                    {isolationTab === 'impacted' &&
                      (isolationAssessment.impactedCustomers.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No customers lose supply for this incident.</p>
                      ) : (
                        isolationAssessment.impactedCustomers.map((customer) => (
                          <div key={customer.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                            <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{customer.location} · loses {formatVolume(customer.lostVolumeScmd)}</p>
                          </div>
                        ))
                      ))}

                    {isolationTab === 'unaffected' &&
                      isolationAssessment.unaffectedCustomers.map((customer) => (
                        <div key={customer.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{customer.location} · {formatVolume(customer.dailyVolumeScmd)} unaffected</p>
                        </div>
                      ))}
                  </div>
                </Card>
              )}

              {isolationAssessment && isolationAssessment.unaffectedZones.length > 0 && (
                <CollapsibleSection title="Uninterrupted network check" subtitle={`${isolationAssessment.unaffectedZones.length} corridors stay pressurized`} icon={ShieldCheck}>
                  <div className="space-y-2">
                    {isolationAssessment.unaffectedZones.map((zone) => (
                      <div key={zone.id} className="rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-slate-900">{zone.id} · {zone.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{zone.note}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {isolationAssessment?.impactedCustomers.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Customer notification</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">Send a message to affected customers</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Compose the outage notice once and send it to all impacted customers for this incident.
                      </p>
                    </div>
                    <Send className="h-5 w-5 text-rose-600" aria-hidden="true" />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400" htmlFor="customer-message">
                      Message to customers
                    </label>
                    <textarea
                      id="customer-message"
                      value={customerMessage}
                      onChange={(event) => setCustomerMessage(event.target.value)}
                      rows={4}
                      placeholder="Example: Emergency maintenance is underway on the SNJ feeder. Supply will remain interrupted until the isolation section is repaired."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Recipients: {isolationAssessment.impactedCustomers.map((customer) => customer.name).join(', ')}
                      </p>
                      <button
                        type="button"
                        onClick={handleSendCustomerMessage}
                        disabled={!customerMessage.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        Send message
                      </button>
                    </div>
                  </div>

                  {messageStatus === 'sent' && sentMessageSummary && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <p className="font-semibold">Message sent</p>
                      <p className="mt-1">Sent to {sentMessageSummary.recipients} at {sentMessageSummary.sentAt}.</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">{sentMessageSummary.message}</p>
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">Pressure status</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Live terminal pressure by customer</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Calculated from each customer's actual chainage back to {NODES.DRS_1.name} on the installed MDPE network. Any customer below {PRESSURE_ALERT_THRESHOLD_BAR.toFixed(1)} bar triggers a WhatsApp and email alert to the internal team.
                    </p>
                  </div>
                  <Gauge className="h-5 w-5 text-sky-600" aria-hidden="true" />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    DRS source pressure (scenario)
                    <input
                      type="number"
                      step="0.1"
                      value={scenarioDrsPressureBar}
                      onChange={(event) => setScenarioDrsPressureBar(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-600"
                    />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Peak demand multiplier
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={demandMultiplier}
                      onChange={(event) => setDemandMultiplier(Number(event.target.value))}
                      className="mt-3.5 w-full accent-sky-600"
                    />
                    <span className="mt-1 block text-sm font-semibold normal-case tracking-normal text-slate-800">{demandMultiplier.toFixed(2)}x peak flow</span>
                  </label>
                </div>

                <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Auto-send alerts</span>
                    <span className="block text-xs text-slate-500">Automatically notify the internal team the moment a customer drops below {PRESSURE_ALERT_THRESHOLD_BAR.toFixed(1)} bar.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoAlertEnabled}
                    onChange={(event) => setAutoAlertEnabled(event.target.checked)}
                    className="h-5 w-5 shrink-0 accent-sky-600"
                  />
                </label>
              </Card>

              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Network pressure summary</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-[11px] uppercase leading-4 tracking-[0.14em] text-slate-400">Customers monitored</p>
                    <p className="mt-1.5 text-lg font-semibold text-slate-900">{pressureStatuses.length}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${lowPressureCustomers.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <p className={`text-[11px] uppercase leading-4 tracking-[0.14em] ${lowPressureCustomers.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>Below {PRESSURE_ALERT_THRESHOLD_BAR.toFixed(1)} bar</p>
                    <p className={`mt-1.5 text-lg font-semibold ${lowPressureCustomers.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{lowPressureCustomers.length}</p>
                  </div>
                </div>
              </Card>

              {lowPressureCustomers.length > 0 && (
                <Card className="border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-rose-900">Low-pressure alert</p>
                      <p className="mt-1 text-xs text-rose-700">Send a manual notification now, or rely on auto-alert above.</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {lowPressureCustomers.map((customer) => (
                      <div key={customer.id} className="rounded-xl border border-rose-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatPressure(customer.actualPressureBar)} actual · {formatDistance(customer.distanceKm)} from {NODES.DRS_1.name}</p>
                          </div>
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Below {PRESSURE_ALERT_THRESHOLD_BAR.toFixed(1)} bar</span>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendPressureAlert(customer, 'whatsapp')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPressureAlert(customer, 'email')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            Email
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <CollapsibleSection title="Alert log" subtitle={`${alertLog.length} notification(s) sent this session`} icon={Send}>
                {alertLog.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">No alerts sent yet.</p>
                ) : (
                  <div className="space-y-2">
                    {alertLog.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                        <p className="font-semibold text-slate-900">{entry.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {entry.channel === 'whatsapp' ? `WhatsApp to ${INTERNAL_ALERT_TEAM.whatsappNumber}` : `Email to ${INTERNAL_ALERT_TEAM.email}`} · {entry.trigger} · {entry.sentAt}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">Pressure at trigger: {formatPressure(entry.pressureBar)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection title="All customers - pressure detail" subtitle={`${pressureStatuses.length} connections on ${NODES.DRS_1.name}`} icon={Droplets}>
                <div className="space-y-2">
                  {pressureStatuses.map((customer) => (
                    <div key={customer.id} className={`rounded-2xl border p-3 ${customer.belowAlertThreshold ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDistance(customer.distanceKm)} · {customer.pipeSpecMm}mm MDPE · required {formatPressure(customer.requiredPressureBar)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer.belowAlertThreshold ? 'bg-rose-100 text-rose-700' : toneForStatus(customer.status)}`}>
                          {formatPressure(customer.actualPressureBar)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </>
          )}
        </div>

        <div className="space-y-4">
          <Card className="relative overflow-hidden p-0">
            <div className="absolute left-4 top-4 z-[500] rounded-xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Marketing module</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Gummidipoondi GIS control room</p>
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
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Available segment</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Pending permission</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#0f172a]" />CGS</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />DRS</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#475569]" />Valve chamber</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#334155]" />Customer</span>
                </div>
              </div>
            )}

            <div ref={mapContainerRef} className="min-h-[720px] w-full" />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Selected option</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{selectedResolvedOption?.label || 'No option selected'}</p>
                  <p className="mt-1 text-sm text-slate-500">Tap point: {selectedResolvedOption?.tapPointName}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(routeSnapshots.source === 'osrm' ? 'Road-snapped route' : 'Estimate route') + ' · ' + (routeSnapshots.loading ? 'updating route geometry...' : 'route geometry ready')}
                  </p>
                </div>
                <Building2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Network at a glance</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">1 CGS · 1 DRS · {SEGMENTS.length} segments</p>
                  <p className="mt-1 text-sm text-slate-500">{ALL_CHAMBERS.length} valve chambers across the network, {CUSTOMERS.length} connected customers.</p>
                </div>
                <Wrench className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
            </Card>
          </div>

          <CollapsibleSection title="Existing customer base" subtitle={`${CUSTOMERS.length} industrial customers connected`} icon={Users}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {CUSTOMERS.map((customer) => {
                const pressureInfo = pressureStatuses.find((item) => item.id === customer.id);
                return (
                  <div key={customer.id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{customer.location} · {NODES[customer.sourceDrsId]?.name} · {customer.valveChamberId}</p>
                        <p className="mt-1 text-xs text-slate-400">{customer.dailyVolumeScmd.toLocaleString('en-IN')} SCMD · {customer.peakFlowScmh} SCMH · required {customer.requiredPressureBar} bar</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{formatVolume(customer.dailyVolumeScmd)}</span>
                        {pressureInfo && (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${pressureInfo.belowAlertThreshold ? 'bg-rose-100 text-rose-700' : toneForStatus(pressureInfo.status)}`}>
                            {formatPressure(pressureInfo.actualPressureBar)} actual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

export default PipelineFeasibilityCheck;