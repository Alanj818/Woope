[//]: # (Tip: Press Cmd+Shift+V in VS Code to view this file rendered)

# Architecture Overview
## Components

### Citizen-Science (Mobile)
- React Native app built with Expo
- Connects to the API via `EXPO_PUBLIC_API_URL` in `.env`
- Handles auth, community feed, map pins, events, organizations, and sensor data display

### woope-admin (Web)
- Vite + React admin panel
- Connects to the API via `VITE_API_URL` in `.env`
- Used to manage organizations, featured content, roles, and sensor settings

### Express API
- Node.js / Express backend running on port `3000`
- Stateless — auth via JWT (access token 15m, refresh token 30d)
- Containerized via Docker alongside PostgreSQL

### PostgreSQL
- Primary data store for all app data
- Persisted via a Docker named volume (`postgres-data`)
- Migrations managed with `db-migrate`

### The Things Network (TTN)
- LoRaWAN IoT sensors in the field push data via MQTT
- API subscribes to the MQTT broker on startup
- Incoming messages are parsed and stored directly to the database

### PurpleAir
- Air quality sensors registered in the database
- API polls the PurpleAir REST API on a configurable interval (default 60 min)
- Interval adjustable at runtime via `PUT /settings/poll-interval`
- Readings and 30-day history stored in the database
