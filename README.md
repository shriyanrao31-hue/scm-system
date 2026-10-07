# 🌐 Real-Time Supply Chain Management & Logistics 4K Command Center

A high-tech, cloud-ready, production-grade real-time Supply Chain Management (SCM) & Logistics Command Center built with **PHP 8.x**, **Node.js (Express + Socket.io)**, **MySQL 8.x**, **Vanilla JS (ES6+)**, **Leaflet.js GIS**, and **Chart.js**.

---

## 📑 TABLE OF CONTENTS
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & System Setup](#2-prerequisites--system-setup)
3. [Local Development & Testing](#3-local-development--testing)
4. [Step 1: Database Setup on Cloud (Railway or Aiven)](#4-step-1-database-setup-on-cloud-railway-or-aiven)
5. [Step 2: Node.js WebSocket Service Deployment (Render)](#5-step-2-nodejs-websocket-service-deployment-render)
6. [Step 3: Frontend & PHP API Deployment (Vercel)](#6-step-3-frontend--php-api-deployment-vercel)
7. [Step 4: Running Real-Time Fleet Telemetry Simulation](#7-step-4-running-real-time-fleet-telemetry-simulation)
8. [Mathematical Models & Automated Formulas](#8-mathematical-models--automated-formulas)
9. [Project File Structure & Zip Compression](#9-project-file-structure--zip-compression)

---

## 1. ARCHITECTURE OVERVIEW

The application is structured into decoupled, cloud-native layers:
- **Relational Data & Transaction Engine:** MySQL 8.x schema (`database/schema.sql`) enforcing foreign-key integrity, transactional locking (`FOR UPDATE`), and indexed telemetry timestamps.
- **REST APIs & Business Logic:** PHP 8.x endpoints managing products, inventory deductions, automated ROP/EOQ evaluations, and Purchase Order Kanban transitions.
- **Real-Time Telemetry Gateway:** Node.js (Express + Socket.io) microservice ingesting GPS coordinates, broadcasting live telemetry to all connected browsers, and proxying PHP internal webhook events.
- **4K Glassmorphism HUD Dashboard:** Single-page application styled in deep slate `#0b0f19` and glowing neon accents (`#00f3ff`, `#10b981`, `#f59e0b`, `#ef4444`). Features Leaflet dark canvas GIS tracking, animated truck SVG markers, and real-time Chart.js graphs.

---

## 2. PREREQUISITES & SYSTEM SETUP

Ensure you have the following installed on your machine:

1. **Git:** [Download Git](https://git-scm.com/downloads) (verify with `git --version`)
2. **Node.js (v18+ or v20+ LTS):** [Download Node.js](https://nodejs.org/) (verify with `node -v` and `npm -v`)
3. **PHP (8.1+ or 8.2+):** [Download PHP](https://www.php.net/downloads) or use XAMPP/Docker (verify with `php -v`)
4. **MySQL (8.0+):** Local MySQL server, XAMPP MySQL, or cloud-hosted database (Railway/Aiven).

---

## 3. LOCAL DEVELOPMENT & TESTING

To run the complete platform on your local machine:

### 3.1 Clone & Configure Environment
```bash
git clone <your-repository-url> scm-prototype
cd scm-prototype
cp .env.example .env
```

### 3.2 Initialize MySQL Database
1. Start your local MySQL instance (via MySQL CLI, MySQL Workbench, or XAMPP).
2. Create the database:
   ```sql
   CREATE DATABASE scm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the tables and bulk synthetic data:
   ```bash
   mysql -u root -p scm_db < database/schema.sql
   mysql -u root -p scm_db < database/seed_synthetic.sql
   ```
   *(Alternatively: run `node database/generate_synthetic_data.js` to customize dataset volume).*

### 3.3 Start the Real-Time Telemetry & Socket Gateway
Open a terminal in `real-time-service/`:
```bash
cd real-time-service
npm install
npm start
```
The microservice will boot on port `3000`:
```
🚀 SCM Real-Time Telemetry & WebSocket Gateway Online
📡 Listening on Port: 3000
🌐 CORS Allowed Origin: *
🔌 Socket.io Ready for 4K HUD Connections
```

### 3.4 Start the PHP Built-in Server
Open a second terminal in the project root:
```bash
php -S localhost:8000
```

### 3.5 Launch the 4K Command Center
Open your browser and navigate to:
```
http://localhost:8000/public/
```
You will see the 4K dark-mode HUD dashboard loaded with warehouse hubs, live UTC clock, inventory tables, and the PO Kanban board.

### 3.6 Run Fleet GPS Simulation
Open a third terminal and run:
```bash
node real-time-service/simulate_telemetry.js
```
Watch the Leaflet GIS map update live as simulated trucks move along highway corridors with live speed and heading indicators.

---

## 4. STEP 1: DATABASE SETUP ON CLOUD (RAILWAY OR AIVEN)

### Option A: Railway (Recommended - Fastest)
1. Sign up at [Railway.app](https://railway.app/).
2. Click **+ New Project** -> **Provision MySQL**.
3. Under the **Variables** or **Connect** tab, copy the connection details:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, or `MYSQL_URL`.
4. Import the schema and seed data into Railway:
   ```bash
   mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < database/schema.sql
   mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE> < database/seed_synthetic.sql
   ```

### Option B: Aiven for MySQL (Free Tier)
1. Sign up at [Aiven.io](https://aiven.io/).
2. Create a free MySQL service and download the `ca.pem` certificate.
3. Import `database/schema.sql` and `database/seed_synthetic.sql` using MySQL Workbench or CLI.

---

## 5. STEP 2: NODE.JS WEBSOCKET SERVICE DEPLOYMENT (RENDER)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete scm real-time command center"
   git branch -M main
   git remote add origin https://github.com/<your-username>/scm-prototype.git
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name:** `scm-telemetry-service`
   - **Root Directory:** `real-time-service`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
6. Under **Environment Variables**, add:
   - `PORT`: `3000`
   - `CORS_ORIGIN`: `*`
7. Click **Create Web Service**.
8. Once deployed, copy your Render public URL (e.g., `https://scm-telemetry-service.onrender.com`).

---

## 6. STEP 3: FRONTEND & PHP API DEPLOYMENT (VERCEL)

1. Install the Vercel CLI globally (or link directly via GitHub on Vercel Dashboard):
   ```bash
   npm install -g vercel
   ```
2. In the project root, run:
   ```bash
   vercel
   ```
3. Set the project environment variables in the Vercel dashboard or via CLI:
   - `DB_HOST`: `<Your Railway or Aiven host>`
   - `DB_PORT`: `3306`
   - `DB_NAME`: `<Your Railway or Aiven database name>`
   - `DB_USER`: `<Your database user>`
   - `DB_PASS`: `<Your database password>`
   - `NODE_SERVICE_URL`: `https://scm-telemetry-service.onrender.com`
4. Deploy to production:
   ```bash
   vercel --prod
   ```
5. Update `public/index.html` with your production Node service URL if needed:
   ```javascript
   window.SCM_CONFIG = {
     API_BASE: '',
     NODE_SERVICE_URL: 'https://scm-telemetry-service.onrender.com'
   };
   ```

---

## 7. STEP 4: RUNNING REAL-TIME FLEET TELEMETRY SIMULATION

To feed live GPS telemetry into your cloud-deployed system from anywhere:
```bash
node real-time-service/simulate_telemetry.js --target https://scm-telemetry-service.onrender.com --interval 1500
```
- Real-time coordinates will be transmitted to the Render WebSocket server.
- The Render gateway emits `telemetry:update` events.
- Your Vercel frontend dashboard will render the trucks smoothly navigating interstate corridors on the 4K Leaflet map in real time.

---

## 8. MATHEMATICAL MODELS & AUTOMATED FORMULAS

### 1. Reorder Point (ROP) Formula
$$\text{ROP} = (\text{Daily Demand Rate} \times \text{Supplier Lead Time (Days)}) + \text{Safety Stock}$$

$$\text{Safety Stock} = 1.65 \times \sqrt{\text{Lead Time}} \times \sigma_d$$
*(computed based on a 95% service level factor $Z = 1.65$)*

### 2. Economic Order Quantity (EOQ) Formula
$$\text{EOQ} = \sqrt{\frac{2 \times \text{Annual Demand} \times \text{Order Cost}}{\text{Holding Cost}}}$$
Where:
- $\text{Annual Demand} = \text{Daily Demand Rate} \times 365$
- $\text{Holding Cost} = \text{Unit Price} \times \text{Holding Cost Rate}$ (default 20% annual)

### 3. Automated Reorder Point Workflow:
1. Stock deduction occurs via `POST /api/inventory.php?action=deduct`.
2. When `quantity_on_hand <= reorder_point`:
   - Stock status is updated to `CRITICAL_REORDER`.
   - A `Draft` Purchase Order is automatically created with quantity equal to the calculated `EOQ`.
   - An internal cURL webhook (`notify_node.php`) sends an event to Node.js.
   - Node.js broadcasts `inventory:alert` and `po:status_change` to all connected clients over WebSockets.

---

## 9. PROJECT FILE STRUCTURE & ZIP COMPRESSION

```
scm-system/
├── vercel.json                         # Vercel serverless configuration for PHP runtime
├── .env.example                        # Environment variables template
├── package.json                        # Root package configuration & build scripts
├── create-zip.js                       # Node.js script to compress project into scm-4k-prototype.zip
├── config/
│   └── database.php                    # PDO Database connection reading from ENV variables
├── api/
│   ├── auth.php                        # JWT/Session authentication endpoint
│   ├── products.php                    # Master catalog & automated ROP evaluation
│   ├── inventory.php                   # Stock deduction API & automated PO trigger
│   ├── purchase_orders.php             # PO state management API
│   ├── shipments.php                   # Shipments & GIS coordinates API
│   └── webhooks/
│       └── notify_node.php             # Internal CURL poster sending events to Node.js
├── real-time-service/
│   ├── package.json                    # Node.js microservice dependencies
│   ├── server.js                       # Express + Socket.io Gateway with CORS & ENV bindings
│   └── simulate_telemetry.js           # CLI script to simulate vehicle GPS telemetry
├── public/
│   ├── css/
│   │   └── styles.css                  # 4K Glassmorphism HUD theme & keyframe FX
│   ├── js/
│   │   ├── app.js                      # Main SPA controller & REST API client
│   │   ├── tracking.js                 # Leaflet.js GIS map renderer with animated SVG markers
│   │   ├── charts.js                   # Chart.js dark-mode animated stock metrics
│   │   └── websocket.js                # Socket.io client setup with auto-reconnect radar
│   └── index.html                      # Single Page Application Command Center Shell
├── database/
│   ├── schema.sql                      # Clean MySQL tables, FK constraints, and performance indexes
│   ├── seed_synthetic.sql              # Bulk synthetic initial dataset loader
│   └── generate_synthetic_data.js      # CLI tool to generate customizable synthetic datasets
└── README.md                           # Complete step-by-step deployment guide from scratch
```

### Compressing the Project into `scm-4k-prototype.zip`
A standalone, zero-dependency Node.js archiver is included. To generate `scm-4k-prototype.zip`, run:
```bash
node create-zip.js
```
Or use the npm script:
```bash
npm run zip
```
The script compresses all code, styles, schemas, and configurations into `scm-4k-prototype.zip` while omitting `node_modules` and `.git`.
