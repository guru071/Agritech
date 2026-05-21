# AgriHub Pro — Real AgriTech Platform

A **production monolith** (not a demo sandbox): one Node.js server serves the marketplace, farmer tools, IoT dashboard, learning hub, admin panel, and REST API. Data is stored in **MongoDB**.

## Quick start (Windows)

1. Install [Node.js](https://nodejs.org/) (18+) and [MongoDB](https://www.mongodb.com/try/download/community).
2. Start MongoDB (`mongod` or MongoDB Compass service).
3. Double-click **`start.bat`** or run:

```bash
cd artifacts/agrihub-monolith
node server.js
```

4. Open **http://localhost:5000** on phone, tablet, or desktop (same Wi‑Fi: use your PC IP, e.g. `http://192.168.1.5:5000`).

## Admin access

1. Open **http://localhost:5000/admin**
2. Enter the token from `artifacts/agrihub-monolith/.env` → `ADMIN_TOKEN_KEY`

## Real features (no fake UI)

| Feature | How it works |
|--------|----------------|
| **Auth** | JWT login/register in MongoDB |
| **Marketplace** | Real products; **Buy Now** creates orders and reduces stock |
| **Payments** | UPI QR from `UPI_VPA` in `.env`; confirm activates subscription |
| **IoT** | Devices POST sensor data to `/api/iot/telemetry/ingest`; dashboard shows latest reading |
| **Land / 3D / Tracker** | Saved per user in MongoDB |
| **Support chat** | Real messages stored in MongoDB; admin replies in admin panel |
| **PWA** | Install on mobile via browser “Add to Home Screen” |

## IoT sensor setup (ESP32 / Arduino)

POST JSON every few seconds (use farmer JWT or device key):

```http
POST /api/iot/telemetry/ingest
Authorization: Bearer <farmer-jwt>
Content-Type: application/json

{
  "soilMoisture": 42,
  "temperature": 29,
  "humidity": 68,
  "tankLevel": 75,
  "nitrogen": 40,
  "phosphorus": 32,
  "potassium": 55,
  "deviceId": "esp32-greenhouse-1"
}
```

Or with device key (set `IOT_DEVICE_KEY` in `.env`):

```http
X-Device-Key: your-device-secret
{"userId":"<mongodb-user-id>", "soilMoisture": 42, ...}
```

## Environment (`artifacts/agrihub-monolith/.env`)

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET` | User session signing |
| `ADMIN_TOKEN_KEY` | Admin dashboard login |
| `UPI_VPA` | Merchant UPI ID for payment QR |
| `IOT_DEVICE_KEY` | Optional hardware ingest key |

## Project layout

- **`artifacts/agrihub-monolith/`** — **Use this.** Full app + API.
- `artifacts/agrihub/` — Legacy Vite frontend (optional dev only).
- `artifacts/api-server/` — Split API variant (not required if using monolith).
- `artifacts/mockup-sandbox/` — UI mockups only; **not** the live app.

## All devices

- Responsive HTML/CSS (mobile bottom nav, desktop layout).
- `viewport` + PWA manifest + service worker for offline shell.
- Access from any device on your network using `http://<your-ip>:5000`.

## Troubleshooting

- **“Could not load products”** — MongoDB not running or wrong `MONGODB_URI`.
- **IoT shows “Awaiting Sensor”** — Normal until your device posts to `/api/iot/telemetry/ingest`.
- **No UPI QR** — Set `UPI_VPA` in `.env` and restart the server.
