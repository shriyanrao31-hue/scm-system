import os
import re
from fpdf import FPDF, XPos, YPos

FONT_PATH = "C:/Windows/Fonts/"

class SCMExplanationPDF(FPDF):
    PRIMARY = (15, 23, 42)      # Deep slate / obsidian
    ACCENT = (0, 102, 204)      # Tech Cyan / Blue
    ACCENT_CYAN = (0, 180, 216) # Neon cyan highlight
    DARK_TXT = (30, 41, 59)     # Dark slate
    MUTED_TXT = (100, 116, 139) # Slate muted
    LIGHT_BG = (248, 250, 252)  # Soft background
    CARD_BG = (241, 245, 249)   # Slightly darker card bg
    WHITE = (255, 255, 255)
    BORDER_COLOR = (203, 213, 225)

    def header(self):
        if self.page_no() > 1:
            self.set_fill_color(*self.PRIMARY)
            self.rect(0, 0, 210, 12, 'F')
            self.set_font('ArialBold', '', 8)
            self.set_text_color(*self.WHITE)
            self.set_y(3.5)
            self.cell(0, 5, 'Nexus SCM 4K Command Center  |  Complete Architecture & Viva Guide', align='C')
            self.ln(10)

    def footer(self):
        self.set_y(-14)
        self.set_fill_color(*self.PRIMARY)
        self.rect(0, 297 - 12, 210, 12, 'F')
        self.set_font('ArialItalic', '', 8)
        self.set_text_color(226, 232, 240)
        self.cell(0, 8, f'Page {self.page_no()}', align='C')

    def h1(self, text):
        self.ln(6)
        self.set_fill_color(*self.ACCENT)
        self.set_text_color(*self.WHITE)
        self.set_font('ArialBold', '', 12)
        self.cell(0, 8.5, '  ' + text, new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.set_text_color(*self.DARK_TXT)
        self.ln(3)

    def h2(self, text):
        self.ln(4)
        self.set_fill_color(*self.CARD_BG)
        self.set_text_color(*self.ACCENT)
        self.set_font('ArialBold', '', 10.5)
        self.cell(0, 7.5, '  ' + text, new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.set_text_color(*self.DARK_TXT)
        self.ln(2)

    def h3(self, text):
        self.ln(2.5)
        self.set_text_color(*self.ACCENT)
        self.set_font('ArialBold', '', 9.5)
        self.cell(0, 6, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*self.DARK_TXT)
        self.ln(1)

    def body_p(self, text):
        self.set_font('Arial', '', 9)
        self.set_text_color(*self.DARK_TXT)
        self.multi_cell(0, 5, text)
        self.ln(1.5)

    def bullet(self, text, bold_prefix=""):
        self.set_x(self.l_margin + 3)
        self.set_font('ArialBold', '', 9)
        self.set_text_color(*self.ACCENT)
        self.cell(4, 5, '-', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        if bold_prefix:
            self.set_text_color(*self.PRIMARY)
            self.cell(self.get_string_width(bold_prefix) + 1, 5, bold_prefix, new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_font('Arial', '', 9)
        self.set_text_color(*self.DARK_TXT)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def num_item(self, num_str, title_str, body_str):
        self.set_x(self.l_margin + 2)
        self.set_font('ArialBold', '', 9)
        self.set_text_color(*self.ACCENT)
        self.cell(self.get_string_width(num_str) + 1.5, 5, num_str, new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_text_color(*self.PRIMARY)
        self.cell(self.get_string_width(title_str) + 1.5, 5, title_str, new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font('Arial', '', 9)
        self.set_text_color(*self.DARK_TXT)
        self.multi_cell(0, 5, body_str)
        self.ln(1.5)

    def code_box(self, code_text):
        self.set_fill_color(241, 245, 249)
        self.set_draw_color(*self.BORDER_COLOR)
        self.set_font('Courier', '', 8)
        self.set_text_color(15, 23, 42)
        lines = code_text.strip().split('\n')
        self.set_x(self.l_margin)
        for line in lines:
            self.cell(0, 4.2, '  ' + line, fill=True, border='LR', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.cell(0, 1, '', border='T', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def speech_box(self, text):
        self.set_fill_color(240, 249, 255)
        self.set_draw_color(*self.ACCENT)
        self.set_line_width(0.8)
        self.set_font('ArialItalic', '', 9)
        self.set_text_color(15, 23, 42)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5.2, '  ' + text, border='L', fill=True)
        self.set_line_width(0.2)
        self.ln(2.5)

    def table_row(self, cells, widths, is_header=False, align_list=None):
        if is_header:
            self.set_fill_color(*self.PRIMARY)
            self.set_text_color(*self.WHITE)
            self.set_font('ArialBold', '', 8.5)
        else:
            self.set_fill_color(*self.LIGHT_BG)
            self.set_text_color(*self.DARK_TXT)
            self.set_font('Arial', '', 8)

        self.set_draw_color(*self.BORDER_COLOR)
        
        # calculate row height based on cell with most lines
        line_height = 4.5
        max_lines = 1
        for i, (cell, w) in enumerate(zip(cells, widths)):
            # approximate lines
            num_lines = max(1, len(str(cell)) // int(w / 1.8) + 1)
            max_lines = max(max_lines, num_lines)
            
        row_h = max(line_height * 1.4, max_lines * line_height)
        
        # check page break
        if self.get_y() + row_h > 275:
            self.add_page()
            if not is_header:
                pass
                
        y_start = self.get_y()
        x_start = self.l_margin
        
        for i, (cell, w) in enumerate(zip(cells, widths)):
            self.set_xy(x_start, y_start)
            align = align_list[i] if align_list else ('C' if is_header else 'L')
            if is_header:
                self.cell(w, row_h, str(cell), border=1, fill=True, align=align)
            else:
                self.rect(x_start, y_start, w, row_h, 'DF')
                self.set_xy(x_start + 1.5, y_start + 1.5)
                self.multi_cell(w - 3, line_height, str(cell), align=align)
            x_start += w
            
        self.set_xy(self.l_margin, y_start + row_h)

def generate_pdf():
    pdf = SCMExplanationPDF(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(14, 16, 14)

    pdf.add_font('Arial', '', FONT_PATH + 'arial.ttf')
    pdf.add_font('ArialBold', '', FONT_PATH + 'arialbd.ttf')
    pdf.add_font('ArialItalic', '', FONT_PATH + 'ariali.ttf')

    pdf.add_page()

    # Cover Title Banner
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 36, 'F')
    pdf.set_xy(14, 8)
    pdf.set_font('ArialBold', '', 17)
    pdf.set_text_color(0, 243, 255)
    pdf.cell(0, 8, 'REAL-TIME SCM & LOGISTICS 4K COMMAND CENTER', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    pdf.set_font('Arial', '', 10)
    pdf.set_text_color(226, 232, 240)
    pdf.cell(0, 6, 'Complete System Architecture, Mathematical Foundations & Viva Voce Guide', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    pdf.set_font('ArialItalic', '', 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 5, 'Production Cloud Deployments: Vercel CDN Edge + Render Socket.io Gateway', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    pdf.set_y(40)

    # 1. Problem Statement
    pdf.h1('1. The Core Problem Statement')
    pdf.body_p('In modern supply chain management and enterprise logistics, companies lose millions of dollars due to three systemic failures:')

    pdf.num_item('1.', 'The "Black Box" In-Transit Problem (Blind Logistics):', 
                 'Once cargo leaves a central warehouse, dispatchers often rely on periodic driver phone calls or delayed EDI check-ins. If a truck faces highway gridlock or mechanical breakdown, dispatch centers learn about it hours later, missing critical delivery windows.')

    pdf.num_item('2.', 'The "Stockout vs. Overstocking" Dilemma (Suboptimal Inventory):', 
                 'If a warehouse orders too little, stock runs out, assembly lines halt, and customer orders fail (costly stockouts). If a warehouse orders too much, huge amounts of working capital are frozen, and storage/holding costs skyrocket. Most legacy systems rely on arbitrary human guesses rather than mathematically verified demand forecasting.')

    pdf.num_item('3.', 'Fragmented, Laggy Data Silos:', 
                 'Warehouse inventory managers, procurement teams, and transport dispatchers work on separate software systems. There is no single, unified, real-time command center where an inventory depletion immediately triggers a purchase order, updates a supplier, and tracks incoming transit on a single screen.')

    pdf.h2('Our Solution')
    pdf.body_p('We engineered the Nexus SCM Real-Time 4K Command Center—a cloud-native, event-driven platform that integrates:')
    pdf.bullet('Sub-second GIS Fleet GPS Telemetry over WebSockets.')
    pdf.bullet('Automated Mathematical Replenishment using Reorder Point (ROP) & Economic Order Quantity (EOQ).')
    pdf.bullet('An Interactive Kanban Procurement Pipeline bridging stock depletions to automated Purchase Orders.')
    pdf.bullet('A High-Tech 4K Glassmorphism HUD providing dispatchers with instantaneous situational awareness.')

    # 2. High-Level Architecture Flow
    pdf.h1('2. High-Level Architecture Flow')
    arch_flow = """+-----------------------------------------------------------------------------------+
|                           FRONTEND SPA (Vercel CDN Edge)                          |
|  [Matrix Terminal Landing] -> [Authorization Gateway] -> [4K Command Center HUD]  |
|      - Leaflet GIS Dark Canvas Map (Truck Directional SVGs, Freight Polylines)    |
|      - Real-Time Chart.js Visual Stock vs ROP Curves & Donut Health Breakdown     |
|      - Interactive 4-Column Procurement Kanban Board                              |
+-----------------------------------------------------------------------------------+
                                        | (Two-way WebSocket wss://)
                                        v
+-----------------------------------------------------------------------------------+
|               REAL-TIME TELEMETRY & EVENT GATEWAY (Render Container)              |
|  Node.js / Express Server  |  Socket.io WebSocket Broker  | In-Memory Cache       |
|  - Telemetry Ingest: POST /api/telemetry/ingest                                   |
|  - Event Ingest: POST /api/events/publish (inventory:alert, po:status_change)      |
|  - Round-Trip Ping/Pong Heartbeat Latency Monitor (4s ticker)                     |
+-----------------------------------------------------------------------------------+
           ^                                                ^
           | (POST Ingest)                                  | (Internal Webhook)
+-------------------------------+              +------------------------------------+
|  IoT GPS Telemetry Engine     |              |  SERVERLESS API LAYER (Vercel)     |
|  simulate_telemetry.js        |              |  - /api/inventory (ROP/EOQ Math)   |
|  Highway coordinate waypoints |              |  - /api/purchase_orders (Kanban)   |
|  Chicago -> Dallas -> LA      |              |  - /api/webhooks/notify_node.js    |
+-------------------------------+              +------------------------------------+"""
    pdf.code_box(arch_flow)

    # 3. Deep-Dive: Splash Screen to Command Center
    pdf.h1('3. Deep-Dive: From Splash Screen to Command Center')
    pdf.h2('View 1: Dynamic "Initiate System" Landing Page')
    pdf.bullet('When you open the application, you are greeted by an animated cyan-green Matrix rain stream over a deep obsidian backdrop (#0b0f19) with a futuristic glitch title: NEXUS COMMAND CENTER.', 'The Visual Experience: ')
    pdf.bullet('It uses the native HTML5 Canvas API (<canvas id="matrix-bg"></canvas>). The canvas measures window.innerWidth and window.innerHeight. A string containing alphanumeric characters, mathematical operators, and symbols is split into vertical column drops. Every 33ms, the render loop paints a translucent rectangle (rgba(11, 15, 25, 0.05)) over the previous frame, creating an optical phosphor decay (fading trail effect), before stamping the next glyph in neon cyan (#00f3ff). Clicking "INITIALIZE SYSTEM" calls switchView("view-login") with zero browser reload.', 'Under the Hood: ')

    pdf.h2('View 2: Authorized Access Control Screen')
    pdf.bullet('A glowing glassmorphism login panel with frosted glass blur (backdrop-filter: blur(16px)), neon borders, and authorized personnel verification.', 'The Visual Experience: ')
    pdf.bullet('Submits an asynchronous POST request to /api/auth. Verifies credentials (admin / password). Critical Performance Optimization: Once authentication succeeds, clearInterval(matrixInterval) is called to terminate the matrix canvas loop. This frees up 100% of GPU/CPU resources for rendering the 4K telemetry charts and the interactive GIS map.', 'Under the Hood: ')

    # 4. GIS Telemetry Map in Extreme Depth
    pdf.h1('4. Deep-Dive: The Live GIS Telemetry Map')
    pdf.body_p('The map is the operational heart of the Command Center, implemented in public/js/tracking.js using Leaflet.js.')

    pdf.h2('1. The High-Tech "Dark-Matter" Styling')
    pdf.body_p('Standard OpenStreetMap tiles are brightly colored, which clashes with a 4K dark command room. Instead of paying for costly proprietary Mapbox keys, we used standard OpenStreetMap tiles and transformed them into a dark canvas using pure CSS hardware-accelerated filters:')
    pdf.code_box("#gis-map .leaflet-tile-pane {\n  filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(120%);\n}")
    pdf.body_p('This converts the map into a deep navy-black canvas where neon routes and markers pop out with crisp clarity.')

    pdf.h2('2. Strategic Logistics Hubs')
    pdf.body_p('Warehouses are plotted at exact geographic coordinates:')
    pdf.bullet('Chicago Apex Hub (ORD-01): [41.9742, -87.9073]')
    pdf.bullet('Dallas SuperCenter (DFW-02): [32.8998, -97.0403]')
    pdf.bullet('Ontario Depot (LAX-03): [34.0537, -117.5982]')
    pdf.bullet('Newark Port Facility (EWR-04): [40.6895, -74.1745]')
    pdf.body_p('Each warehouse uses a custom L.divIcon displaying a pulsing emerald beacon (.custom-hub-marker). Clicking a hub opens a custom dark HUD popup showing warehouse code, operational name, and location.')

    pdf.h2('3. Animated Vehicle Markers & Directional Heading')
    pdf.bullet('Each vehicle is rendered using an SVG chevron arrow inside a vehicle-div-wrapper.')
    pdf.bullet('Dynamic Orientation: When the truck turns, the SVG rotates dynamically to match the truck\'s actual bearing using inline CSS transforms: style="transform: rotate(${heading}deg);"')
    pdf.bullet('Color-Coded Status: Neon Cyan (#00f3ff) for on-schedule vehicles ("In Transit"), and Crimson Red (#ef4444) for transport hazards or delays ("Delayed").')

    pdf.h2('4. Polyline Highway Corridors')
    pdf.body_p('Active routes are traced across major US interstate corridors (e.g., I-80, I-35, I-10) using L.polyline. Routes are styled with semi-transparent cyan dashed strokes (dashArray: "6, 8"), displaying the planned trajectory between source and destination hubs.')

    pdf.h2('5. How Live GPS Data Reaches the Map (The Streaming Pipeline)')
    pdf.num_item('1.', 'CLI Simulator:', 'simulate_telemetry.js reads GPS waypoints along freight routes and POSTs coordinates every 1.2s to Render.')
    pdf.num_item('2.', 'Render Gateway:', 'Caches vehicle coordinates in activeVehicleCache and fires io.emit("telemetry:update", payload).')
    pdf.num_item('3.', 'Browser HUD:', 'telemetryRadar catches the packet and invokes trackerMap.renderOrUpdateVehicle(data).')
    pdf.num_item('4.', 'Smooth Translation:', 'Existing marker position is updated with marker.setLatLng([lat, lng]) and rotated smoothly without redrawing the map or flickering.')

    # 5. Inventory Analysis & Math
    pdf.h1('5. Inventory Analysis & Mathematical Models')
    pdf.body_p('Rather than using arbitrary alerts, the system executes two classical industrial engineering formulas inside api/inventory.js:')

    pdf.h2('1. Reorder Point (ROP) - "When to Order"')
    pdf.body_p('The Reorder Point represents the inventory level that triggers a replenishment order so that new stock arrives just as safety stock is reached:')
    pdf.code_box("ROP = (Daily Demand Rate * Supplier Lead Time) + Safety Stock\n\nSafety Stock = Z * sqrt(Lead Time) * sigma_d\n             = 1.65 * sqrt(Lead Time) * sigma_d  (for 95% Service Level)")
    pdf.bullet('Daily Demand Rate (d): Units consumed per operational day.')
    pdf.bullet('Lead Time (L): Number of days required for the supplier to manufacture and ship the items.')
    pdf.bullet('Z-Score (Service Level): We chose Z = 1.65, which corresponds to a 95% service level, ensuring only a 5% statistical probability of stockout during supplier lead time.')
    pdf.bullet('sigma_d: Standard deviation of daily demand.')

    pdf.h2('2. Economic Order Quantity (EOQ) - "How Much to Order"')
    pdf.body_p('The EOQ (Wilson Formula) calculates the optimal order size that minimizes total inventory costs by finding the mathematical equilibrium between holding costs and ordering costs:')
    pdf.code_box("EOQ = sqrt( (2 * Annual Demand * Order Cost) / Holding Cost )")
    pdf.bullet('D (Annual Demand): Total number of units required per year.')
    pdf.bullet('S (Order Cost): Fixed administrative and shipping cost incurred every time an order is placed.')
    pdf.bullet('H (Holding Cost): Annual cost of storing, insuring, and handling one unit in the warehouse.')

    pdf.h2('3. Stock Health Classifications')
    pdf.bullet('OPTIMAL (Emerald Badge): Current stock > ROP. Safe operational buffer.')
    pdf.bullet('LOW_STOCK (Amber Badge): Current stock <= ROP. Replenishment needed.')
    pdf.bullet('CRITICAL_REORDER (Pulsing Crimson Badge): Current stock < 70% of ROP. Urgent replenishment triggered.')
    pdf.bullet('OUT_OF_STOCK (Solid Red Badge): Stock = 0. Critical disruption alert.')

    pdf.h2('4. Chart.js Visual Telemetry')
    pdf.bullet('Dual-Axis Bar & Line Chart: Displays on-hand inventory levels for every SKU (cyan vertical bars) contrasted directly against a horizontal red dashed threshold representing the Reorder Point. If any bar drops below the dashed line, it visually alerts the operator.')
    pdf.bullet('Donut Chart: Renders the proportional health breakdown of the entire warehouse network (Optimal vs Low vs Critical).')

    # 6. Automated Procurement Pipeline
    pdf.h1('6. The Automated Procurement Pipeline (Kanban Flow)')
    pdf.body_p('The automated reorder workflow links stock deductions directly to supplier purchase orders:')
    pdf.num_item('1.', 'Stock Deduction:', 'Operator or ERP deducts stock via POST /api/inventory?action=deduct.')
    pdf.num_item('2.', 'Automated Threshold Check:', 'System evaluates current_stock <= ROP. If true, status updates to CRITICAL_REORDER.')
    pdf.num_item('3.', 'Auto-Generation of PO:', 'System automatically creates a new Purchase Order with quantity = max(EOQ, 50).')
    pdf.num_item('4.', 'Internal Webhook:', '/api/webhooks/notify_node.js sends events to Render (POST /api/events/publish).')
    pdf.num_item('5.', 'WebSocket Broadcast:', 'Render gateway emits inventory:alert and po:status_change to all connected HUD browsers.')
    pdf.num_item('6.', 'Reactive UI:', 'The Kanban board receives the new Draft card and the stock table highlights in red without page refresh.')

    pdf.h2('The Kanban Stages')
    pdf.bullet('Draft (Auto-Generated): Automatically spawned when ROP is breached with the exact EOQ batch quantity.')
    pdf.bullet('Issued: Procurement officer verifies supplier pricing and issues the PO to the vendor.')
    pdf.bullet('In Transit: The vendor dispatches freight; shipping coordinates bind to the GIS tracking map.')
    pdf.bullet('Received: Shipments arrive at the warehouse loading dock, stock is replenished, and the item status resets to OPTIMAL.')

    # 7. Dynamic Architecture
    pdf.h1('7. How We Made the System Truly Dynamic')
    pdf.bullet('Decoupled Event Gateway: Vercel handles edge assets, while Render maintains persistent bi-directional WebSockets (Socket.io). State changes broadcast instantly across the network.')
    pdf.bullet('Reactive DOM Updates: When a WebSocket packet arrives (telemetry:update or inventory:alert), the browser dynamically updates only the affected DOM nodes or markers without re-rendering the entire page.')
    pdf.bullet('Continuous Radar Ping-Pong: Every 4 seconds, the client sends a hud:ping timestamp to Render, which bounces back a hud:pong. The round-trip time updates the live HUD latency in milliseconds (e.g., 38ms).')
    pdf.bullet('Simulation Engine: A background CLI runner (simulate_telemetry.js) feeds live GPS telemetry packets along real highway corridors into Render, causing vehicles to traverse the continental US in real time.')
    pdf.bullet('Dynamic Service Binding: public/js/websocket.js supports dynamic connection strings via URL parameters (?node=...), browser localStorage, or environment defaults, allowing the system to run in the cloud or on local networks.')

    # 8. Problem Statement Resolution Matrix
    pdf.h1('8. Summary: How This Solves the Problem Statement')
    headers = ['Problem in Traditional SCM', 'How Our Command Center Solves It', 'Technical Implementation']
    widths = [55, 65, 62]
    pdf.table_row(headers, widths, is_header=True)
    
    rows = [
        ['Blind In-Transit Freight', 'Sub-second GIS map updates showing exact vehicle position, speed, heading, and delays.', 'Leaflet.js + Socket.io GPS packet streaming over WebSockets.'],
        ['Frequent Stockouts', 'Mathematical Reorder Point triggers replenishment before stock runs dry.', 'ROP = (d * L) + (1.65 * sqrt(L) * sigma_d) in /api/inventory.js.'],
        ['Excess Holding Costs', 'Orders are batched at mathematically optimal cost curves.', 'Wilson EOQ Formula sqrt(2DS/H) calculates exact order size.'],
        ['Delayed Procurement', 'Eliminates manual paperwork by auto-generating Draft POs the instant ROP is breached.', 'Automated event-driven PO creation linked to Kanban board.'],
        ['Fragmented Systems', 'All data (fleet, stock, POs, latency) unifies on a single 4K command screen.', 'Glassmorphism SPA + Event Bus on Vercel & Render.']
    ]
    for r in rows:
        pdf.table_row(r, widths)

    # 9. 2-Minute Viva Speech Script
    pdf.h1('9. 2-Minute Viva Speech Script')
    speech = ('"Respected Examiners, our project addresses the core challenge of modern supply chain management: '
              'lack of real-time visibility and delayed inventory replenishment.\n\n'
              'We built the Nexus SCM 4K Command Center using a decoupled cloud architecture: our frontend and serverless APIs '
              'run on Vercel, while our real-time telemetry gateway runs on Render using Node.js and Socket.io.\n\n'
              'When an operator logs into the Command Center, they see three synchronized layers:\n'
              '1. First, our GIS Fleet Tracking Map built with Leaflet.js, which receives live GPS coordinates and directional heading '
              'over WebSockets from our simulation engine, rendering animated vehicle markers along transport corridors.\n'
              '2. Second, our Inventory Intelligence Engine, which monitors stock levels against mathematically computed Reorder Points (ROP) '
              'using a 95% service level.\n'
              '3. Third, our Automated Procurement Kanban Board. The moment an item\'s stock drops below its Reorder Point, the system automatically '
              'calculates the Economic Order Quantity (EOQ) to balance ordering and holding costs, generates a new Purchase Order, and broadcasts the '
              'alert over WebSockets to all connected command center screens without requiring a page refresh.\n\n'
              'By combining WebSockets with classical operational management formulas, we eliminate blind transit spots and prevent both stockouts and overstocking."')
    pdf.speech_box(speech)

    output_path = 'SCM_Project_Complete_Explanation.pdf'
    pdf.output(output_path)
    print(f"SUCCESS: PDF generated successfully at {os.path.abspath(output_path)}")

if __name__ == '__main__':
    generate_pdf()
