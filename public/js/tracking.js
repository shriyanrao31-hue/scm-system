/**
 * Leaflet.js GIS Real-Time Fleet & Logistics Tracking Engine
 * Renders dark tile layer, animated vehicle markers, glowing destination hubs,
 * route polylines, and hazard delay pulses.
 */

class FleetTrackerMap {
  constructor(containerId = 'gis-map') {
    this.containerId = containerId;
    this.map = null;
    this.vehicleMarkers = new Map(); // tracking_number -> { marker, polyline, data }
    this.hubMarkers = [];
    this.initMap();
  }

  initMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet.js library is missing.');
      return;
    }

    // Centered over North American continental logistics corridor
    this.map = L.map(this.containerId, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: false,
      attributionControl: false
    });

    // Free OpenStreetMap tile layer for High-Tech HUD (Colored Dark via CSS filters)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  // Load and plot strategic warehouse hubs
  plotWarehouses(warehouses) {
    if (!this.map) return;

    warehouses.forEach(wh => {
      const hubIcon = L.divIcon({
        className: 'custom-hub-icon-wrapper',
        html: `<div class="custom-hub-marker" title="${wh.name}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([wh.lat, wh.lng], { icon: hubIcon }).addTo(this.map);
      marker.bindPopup(`
        <div style="font-family: monospace; color: #fff; background: #0b0f19; padding: 6px;">
          <strong style="color: #10b981;">HUB: ${wh.code}</strong><br/>
          <span>${wh.name}</span><br/>
          <small style="color: #94a3b8;">${wh.city}, ${wh.country}</small>
        </div>
      `);
      this.hubMarkers.push(marker);
    });
  }

  // Initial load of active shipments and polylines
  loadInitialShipments(shipments) {
    if (!this.map) return;

    shipments.forEach(s => {
      this.renderOrUpdateVehicle(s);
    });
  }

  // Real-time update of vehicle position with smooth animation
  renderOrUpdateVehicle(data) {
    if (!this.map) return;

    const idKey = data.tracking_number || `SHIP-${data.id || data.shipment_id}`;
    const lat = data.current_position ? data.current_position.lat : data.lat;
    const lng = data.current_position ? data.current_position.lng : data.lng;
    const speed = data.current_position ? data.current_position.speed_mph : (data.speed || 0);
    const heading = data.current_position ? data.current_position.heading_deg : (data.heading || 0);
    const status = data.status || 'In Transit';
    const carrier = data.carrier || 'Fleet Asset';

    if (!lat || !lng) return;

    const isDelayed = status === 'Delayed';
    const iconClass = isDelayed ? 'marker-inner delayed' : 'marker-inner';

    const customSvg = `
      <div class="custom-vehicle-marker" style="transform: rotate(${heading}deg);">
        <div class="${iconClass}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isDelayed ? '#ef4444' : '#00f3ff'}" stroke-width="2.5">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'vehicle-div-wrapper',
      html: customSvg,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (this.vehicleMarkers.has(idKey)) {
      // Smoothly update existing marker position
      const entry = this.vehicleMarkers.get(idKey);
      entry.marker.setLatLng([lat, lng]);
      entry.marker.setIcon(icon);
      entry.data = data;
    } else {
      // Create new marker
      const marker = L.marker([lat, lng], { icon }).addTo(this.map);

      // Create route polyline if geometry exists
      let polyline = null;
      if (data.route_geometry && Array.isArray(data.route_geometry)) {
        polyline = L.polyline(data.route_geometry, {
          color: isDelayed ? '#ef4444' : '#00f3ff',
          weight: 2,
          opacity: 0.6,
          dashArray: '6, 8'
        }).addTo(this.map);
      }

      marker.bindPopup(`
        <div style="font-family: monospace; color: #fff; background: #0b0f19; padding: 8px; border-radius: 4px; border: 1px solid rgba(0, 243, 255, 0.3);">
          <strong style="color: #00f3ff;">${idKey}</strong><br/>
          <span>Carrier: ${carrier}</span><br/>
          <span>Speed: <strong>${speed} mph</strong></span><br/>
          <span>Status: <span style="color: ${isDelayed ? '#ef4444' : '#10b981'};">${status}</span></span><br/>
          <small style="color: #94a3b8;">Heading: ${heading}°</small>
        </div>
      `);

      this.vehicleMarkers.set(idKey, { marker, polyline, data });
    }
  }

  // Handle incoming live telemetry packet
  handleLiveTelemetry(telemetry) {
    this.renderOrUpdateVehicle(telemetry);
  }
}

window.FleetTrackerMap = FleetTrackerMap;
