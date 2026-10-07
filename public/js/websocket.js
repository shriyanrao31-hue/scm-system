/**
 * Socket.io Telemetry & Radar Controller
 * Manages WebSocket connection, latency ping-pong, and real-time event dispatching.
 */

class TelemetryRadarClient {
  constructor(serviceUrl = null) {
    // Auto-detect service URL or fallback to localhost:3000
    this.serviceUrl = serviceUrl || window.SCM_CONFIG?.NODE_SERVICE_URL || (
      window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin
    );
    this.socket = null;
    this.latencyMs = 0;
    this.isConnected = false;
    this.listeners = new Map();

    this.initElements();
    this.connect();
    this.startLatencyMonitor();
  }

  initElements() {
    this.pulseDotEl = document.getElementById('radar-pulse-dot');
    this.latencyTextEl = document.getElementById('radar-latency-val');
    this.connectedClientsEl = document.getElementById('radar-clients-val');
    this.statusTextEl = document.getElementById('hud-connection-status');
  }

  connect() {
    console.log(`🔌 Initializing WebSocket connection to: ${this.serviceUrl}`);

    if (typeof io === 'undefined') {
      console.warn('⚠️ Socket.io client library not loaded. Running in decoupled mode.');
      this.updateStatus(false, 'OFFLINE (LIB_MISSING)');
      return;
    }

    try {
      this.socket = io(this.serviceUrl, {
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 100,
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.updateStatus(true, 'LINK ACTIVE');
        console.log(`✅ [SOCKET CONNECTED] Socket ID: ${this.socket.id}`);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.updateStatus(false, 'DISCONNECTED');
        console.warn(`❌ [SOCKET DISCONNECTED] Reason: ${reason}`);
      });

      this.socket.on('connect_error', (err) => {
        this.isConnected = false;
        this.updateStatus(false, 'CONN ERROR');
      });

      // Periodic Telemetry Pulse from Gateway
      this.socket.on('telemetry:pulse', (data) => {
        if (this.connectedClientsEl && data.clients) {
          this.connectedClientsEl.innerText = `${data.clients} NODES`;
        }
      });

      // Pong response to compute round-trip HUD latency
      this.socket.on('hud:pong', (data) => {
        const roundTrip = Date.now() - data.clientTimestamp;
        this.latencyMs = roundTrip;
        if (this.latencyTextEl) {
          this.latencyTextEl.innerText = `${this.latencyMs}ms`;
        }
      });

      // Real-time Ingestion & Business Event streams
      this.socket.on('telemetry:update', (data) => this.emit('telemetry:update', data));
      this.socket.on('telemetry:snapshot', (data) => this.emit('telemetry:snapshot', data));
      this.socket.on('inventory:alert', (data) => this.emit('inventory:alert', data));
      this.socket.on('po:status_change', (data) => this.emit('po:status_change', data));
      this.socket.on('system:event', (data) => this.emit('system:event', data));

    } catch (e) {
      console.error('Socket initialization failed:', e);
      this.updateStatus(false, 'INIT_ERR');
    }
  }

  startLatencyMonitor() {
    setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('hud:ping', Date.now());
      }
    }, 4000);
  }

  updateStatus(connected, text) {
    if (this.pulseDotEl) {
      if (connected) {
        this.pulseDotEl.classList.remove('disconnected');
      } else {
        this.pulseDotEl.classList.add('disconnected');
      }
    }
    if (this.statusTextEl) {
      this.statusTextEl.innerText = text;
      this.statusTextEl.style.color = connected ? 'var(--accent-emerald)' : 'var(--accent-crimson)';
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(cb => {
        try { cb(data); } catch (e) { console.error(`Error in event listener for ${eventName}:`, e); }
      });
    }
  }
}

window.TelemetryRadar = TelemetryRadarClient;
