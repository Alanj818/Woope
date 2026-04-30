# Woope — Citizen Science App
A mobile platform for crowdsourcing environmental data and fostering community engagement for Standing Rock's Lakota and Dakota Nations.

## What's in this repo
| Folder | What it is |
|--------|------------|
| `Citizen-Science` | React Native mobile app (iOS & Android) |
| `api` | Express REST API + PostgreSQL (runs in Docker) |
| `woope-admin` | React admin panel for managing users, orgs, and sensors |

## Prerequisites
- [Node v20](https://github.com/nvm-sh/nvm) — use nvm to manage versions
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — runs the API and database
- [Expo Go](https://expo.dev/go) — install on your phone to run the mobile app

## 1 — API
```bash
cd api && npm install
```
Create `api/.env`:
```
ACCESS_TOKEN_SECRET=39b3cfd461ccb82ba097358c1c0557bbfac4a1a9fbd9bfc6e1bac511e7c9ca60
ACCESS_TOKEN_LIFE=15m
REFRESH_TOKEN_SECRET=8c3cd2786ddf92f44f85af2694572241c9c0571cfc4e173e5c86a4fa82dd51cc
REFRESH_TOKEN_LIFE=30d
```
```bash
docker compose build && docker compose up
npx db-migrate up  # first time only
```
Check it's working: [http://localhost:3000/health](http://localhost:3000/health) should return `OK`.

## 2 — Mobile App
```bash
cd Citizen-Science && npm install
```
Create `Citizen-Science/.env`:
```
EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_IP>:3000
```
> Find your IP in System Preferences → Network (Mac) or `ipconfig` (Windows). Example: `http://192.168.0.100:3000`
```bash
npx expo start
```
Scan the QR code with Expo Go on your phone.

## 3 — Admin Panel
```bash
cd woope-admin && npm install
```
Create `woope-admin/.env`:
```
VITE_API_URL=http://localhost:3000
```
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). You'll need a System Admin account to log in.

## Email Verification
Add to `api/.env` to enable OTP email verification during sign up:
```
EMAIL_USER=csun.citizen.science@gmail.com
EMAIL_PASS=pbkk ewjm yxkv fxwh
```

## Documentation
All docs are in the `Documentation/` folder:
- `architecture.md` — how the apps connect
- `backend-routes-endpoints.md` — all API routes
- `frontend-screens.md` — all mobile app screens
- `admin-panel.md` — admin panel pages
- `database-schema.md` — database tables and relationships
