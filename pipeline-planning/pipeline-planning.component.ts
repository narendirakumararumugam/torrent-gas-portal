import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface Drs {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  capacity: number;
  utilization: number;
  pressure: number;
}
interface RouteOption {
  id: number;
  distance: number;
  geometry: L.LatLngExpression[];
  color: string;
}

@Component({
  selector: 'app-pipeline-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pipeline-planning.component.html',
  styleUrls: ['./pipeline-planning.component.css'],
})
export class PipelinePlanningComponent implements AfterViewInit, OnDestroy {
  private map?: L.Map;
  private routeLayers: L.Polyline[] = [];
  private destinationMarker?: L.Marker;
  private drsMarkers: L.Marker[] = [];
  drsList: Drs[] = [
    {
      id: 'DRS-001',
      name: 'HCL DRS',
      location: 'Ambattur Industrial Estate, Chennai',
      lat: 13.0998863,
      lng: 80.1668283,
      capacity: 2000,
      utilization: 55,
      pressure: 4,
    },
    {
      id: 'DRS-002',
      name: 'Athipet DRS',
      location: 'Athipet, Chennai',
      lat: 13.1128836,
      lng: 80.1500843,
      capacity: 5000,
      utilization: 62,
      pressure: 4,
    },
    {
      id: 'DRS-004',
      name: 'Gummudipoondi DRS',
      location: 'Gummudipoondi, Chennai',
      lat: 13.4197617,
      lng: 80.1123003,
      capacity: 6000,
      utilization: 57,
      pressure: 4,
    },
  ];
  selectedDrs = this.drsList[0];
  capacity = 5000;
  outletPressure = 4;
  demand = 300;
  minPressure = 4;
  operatingHours = 20;
  futureDemand = 0;
  diameterOptions = [63, 90, 110, 125, 160, 180, 200, 250];
  selectedDiameter = 125;
  customDiameter: number | null = null;
  material = 'PE100';
  roughness = 0.007;
  gasTemperature = 25;
  gasGravity = 0.62;
  elevation = 0;
  fittings = 8;
  destination: L.LatLngLiteral = { lat: 13.032, lng: 80.184 };
  destinationName = 'Koyambedu Industrial Area, Chennai';
  selectingDestination = false;
  routes: RouteOption[] = [];
  selectedRoute?: RouteOption;
  loadingRoutes = false;
  routeError = '';
  mapReady = false;
  constructor(private zone: NgZone) {}
  ngAfterViewInit() {
    this.initMap();
  }
  ngOnDestroy() {
    this.map?.remove();
  }
  get existingDemand() {
    return Math.round((this.capacity * this.selectedDrs.utilization) / 100);
  }
  get availableCapacity() {
    return this.capacity - this.existingDemand;
  }
  get totalDemand() {
    return this.demand + this.futureDemand;
  }
  get remainingCapacity() {
    return this.availableCapacity - this.totalDemand;
  }
  get utilization() {
    return Math.round(
      ((this.existingDemand + this.totalDemand) / this.capacity) * 100,
    );
  }
  get dailyRequirement() {
    return this.demand * this.operatingHours;
  }
  get effectiveDiameter() {
    return this.customDiameter && this.customDiameter > 0
      ? this.customDiameter
      : this.selectedDiameter;
  }
  get elevationLoss() {
    return Math.max(0, this.elevation) * 0.0098;
  }
  get maximumPermissibleDrop() {
    return Math.max(
      0,
      this.outletPressure - this.minPressure - this.elevationLoss,
    );
  }
  get sizeAnalysis() {
    if (!this.selectedRoute) return [];
    return this.diameterOptions.map((diameter) => ({
      diameter,
      drop: this.pressureDrop(this.selectedRoute!, diameter),
      pressure: this.destinationPressure(this.selectedRoute!, diameter),
      status: this.hydraulicStatus(this.selectedRoute!, diameter),
      maxFlow: this.maximumFlow(this.selectedRoute!, diameter),
    }));
  }
  get recommendedDiameter() {
    return this.sizeAnalysis.find((item) => item.status === 'PASS')?.diameter;
  }
  destinationPressure(
    route = this.selectedRoute,
    diameter = this.effectiveDiameter,
  ) {
    if (!route) return 0;
    return +(
      this.outletPressure -
      this.pressureDrop(route, diameter) -
      this.elevationLoss
    ).toFixed(2);
  }
  pressureDrop(route: RouteOption, diameter = this.effectiveDiameter) {
    const materialFactor =
      this.material === 'Steel' ? 1.14 : this.material === 'PE80' ? 1.06 : 1;
    const temperatureFactor = 1 + (this.gasTemperature - 25) * 0.003;
    const gravityFactor = this.gasGravity / 0.62;
    const fittingFactor = 1 + this.fittings * 0.012;
    return +(
      1.9 *
      (route.distance / 7.2) *
      Math.pow(Math.max(this.totalDemand, 1) / 3500, 1.85) *
      Math.pow(125 / diameter, 2.1) *
      materialFactor *
      (this.roughness / 0.007) *
      temperatureFactor *
      gravityFactor *
      fittingFactor
    ).toFixed(2);
  }
  hydraulicStatus(route: RouteOption, diameter = this.effectiveDiameter) {
    if (
      this.totalDemand > this.availableCapacity ||
      this.destinationPressure(route, diameter) < this.minPressure
    )
      return 'FAIL';
    return this.destinationPressure(route, diameter) - this.minPressure < 0.15
      ? 'BORDERLINE'
      : 'PASS';
  }
  feasible(route: RouteOption, diameter = this.effectiveDiameter) {
    return this.hydraulicStatus(route, diameter) !== 'FAIL';
  }
  maximumFlow(route: RouteOption, diameter: number) {
    const currentDrop = this.pressureDrop(route, diameter);
    if (!currentDrop || !this.maximumPermissibleDrop) return 0;
    return Math.max(
      0,
      Math.min(
        this.availableCapacity,
        Math.round(
          (this.totalDemand *
            Math.pow(this.maximumPermissibleDrop / currentDrop, 1 / 1.85)) /
            100,
        ) * 100,
      ),
    );
  }
  chartY(drop: number) {
    const max = Math.max(
      ...this.sizeAnalysis.map((item) => item.drop),
      this.maximumPermissibleDrop,
      0.1,
    );
    return +(145 - Math.min(drop / max, 1) * 110).toFixed(1);
  }
  chartPoints() {
    return this.sizeAnalysis
      .map((item, index) => `${40 + index * 48},${this.chartY(item.drop)}`)
      .join(' ');
  }
  selectDrs(id: string) {
    const next = this.drsList.find((d) => d.id === id);
    if (!next) return;
    this.selectedDrs = next;
    this.capacity = next.capacity;
    this.outletPressure = next.pressure;
    this.drawDrsMarkers();
    this.map?.setView([next.lat, next.lng], 12);
    this.clearRoutes();
  }
  activateDestination() {
    this.selectingDestination = true;
    this.routeError =
      'Click anywhere on the Chennai map to place the gas requirement marker.';
  }
  private initMap() {
    this.map = L.map('chennai-route-map', { zoomControl: true }).setView(
      [13.045, 80.215],
      11,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.on('click', (event: L.LeafletMouseEvent) =>
      this.zone.run(() => {
        if (this.selectingDestination) this.setDestination(event.latlng);
      }),
    );
    this.drawDrsMarkers();
    this.setDestination(this.destination, false);
    this.mapReady = true;
  }
  private icon(kind: 'drs' | 'target') {
    return L.divIcon({
      className: 'map-icon',
      html: `<div class="${kind}-marker"><i class="ri-${kind === 'drs' ? 'gas-station' : 'map-pin-2'}-fill"></i></div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });
  }
  private drawDrsMarkers() {
    this.drsMarkers.forEach((marker) => marker.remove());
    this.drsMarkers = [];
    if (!this.map) return;
    this.drsList.forEach((drs) => {
      const marker = L.marker([drs.lat, drs.lng], { icon: this.icon('drs') })
        .addTo(this.map!)
        .bindPopup(
          `<b>${drs.id} · ${drs.name}</b><br>${drs.location}<br>Available capacity: ${Math.round(drs.capacity * (1 - drs.utilization / 100)).toLocaleString()} SCM/hr`,
        );
      marker.on('click', () => this.zone.run(() => this.selectDrs(drs.id)));
      this.drsMarkers.push(marker);
    });
  }
  setDestination(point: L.LatLngLiteral | L.LatLng, pan = true) {
    this.destination = { lat: point.lat, lng: point.lng };
    this.destinationName = `Selected Chennai location · ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
    this.selectingDestination = false;
    this.routeError = '';
    if (!this.map) return;
    this.destinationMarker?.remove();
    this.destinationMarker = L.marker([point.lat, point.lng], {
      icon: this.icon('target'),
      draggable: true,
    })
      .addTo(this.map)
      .bindPopup('<b>Gas requirement location</b><br>Drag to refine location.');
    this.destinationMarker.on('dragend', () =>
      this.zone.run(() =>
        this.setDestination(this.destinationMarker!.getLatLng(), false),
      ),
    );
    if (pan) this.map.panTo([point.lat, point.lng]);
    this.clearRoutes();
  }
  async findRoutes() {
    if (!this.map) return;
    this.loadingRoutes = true;
    this.routeError = '';
    this.clearRoutes();
    const s = this.selectedDrs;
    const url = `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${this.destination.lng},${this.destination.lat}?alternatives=true&overview=full&geometries=geojson`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing request failed');
      const result = await response.json();
      if (!result.routes?.length) throw new Error('No road route returned');
      this.zone.run(() => {
        this.routes = result.routes
          .slice(0, 3)
          .map((route: any, index: number) => ({
            id: index + 1,
            distance: +(route.distance / 1000).toFixed(1),
            geometry: route.geometry.coordinates.map(
              (p: number[]) => [p[1], p[0]] as L.LatLngExpression,
            ),
            color: ['#087f58', '#237bb7', '#ec8a2e'][index],
          }));
        this.selectedRoute = this.routes[0];
        this.drawRoutes();
        this.loadingRoutes = false;
      });
    } catch {
      this.zone.run(() => {
        this.loadingRoutes = false;
        this.routeError =
          'Road routing is currently unavailable. Check your internet connection and try again.';
      });
    }
  }
  selectRoute(route: RouteOption) {
    this.selectedRoute = route;
    this.drawRoutes();
  }
  private clearRoutes() {
    this.routeLayers.forEach((layer) => layer.remove());
    this.routeLayers = [];
    this.routes = [];
    this.selectedRoute = undefined;
  }
  private drawRoutes() {
    if (!this.map) return;
    this.routeLayers.forEach((layer) => layer.remove());
    this.routeLayers = this.routes.map((route) => {
      const layer = L.polyline(route.geometry, {
        color: route.color,
        weight: route.id === this.selectedRoute?.id ? 8 : 5,
        opacity: route.id === this.selectedRoute?.id ? 1 : 0.62,
        dashArray: route.id === this.selectedRoute?.id ? undefined : '10 8',
      }).addTo(this.map!);
      layer.on('click', () => this.zone.run(() => this.selectRoute(route)));
      return layer;
    });
    if (this.selectedRoute)
      this.map.fitBounds(L.latLngBounds(this.selectedRoute.geometry), {
        padding: [40, 40],
      });
  }
}
