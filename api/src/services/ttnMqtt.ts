import mqtt from "mqtt";
const pool = require("../db");

function pickNumber(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v === 0) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function pickString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.length) return v;
  }
  return null;
}

export function startTtnMqtt() {
  const appId = process.env.TTN_APP_ID;
  const apiKey = process.env.TTN_API_KEY;
  const region = process.env.TTN_REGION || "nam1";

  if (!appId || !apiKey) {
    console.error("Missing TTN_APP_ID or TTN_API_KEY in .env");
    return;
  }

  const broker = `mqtts://${region}.cloud.thethings.network:8883`;
  const topic = `v3/${appId}/devices/+/up`;

  const client = mqtt.connect(broker, {
    username: appId,
    password: apiKey,
    keepalive: 30,
    reconnectPeriod: 2000,
  });

  client.on("connect", () => {
    console.log("✅ Connected to TTN MQTT");
    console.log("📡 Subscribing to:", topic);

    client.subscribe(topic, (err) => {
      if (err) console.error("Subscribe error:", err.message);
    });
  });

  client.on("message", async (_topic, payload) => {
    let msg: any;

    try {
      msg = JSON.parse(payload.toString());
    } catch (err) {
      console.error("❌ MQTT message was not valid JSON:", err);
      return;
    }

    try {
      const deviceId = msg?.end_device_ids?.device_id;
      const uplink = msg?.uplink_message;
      const decoded = uplink?.decoded_payload ?? {};

      if (!deviceId || !uplink) return;

      const receivedAtRaw =
        pickString(uplink, ["received_at"]) ||
        pickString(msg, ["received_at"]) ||
        null;

      const receivedAt = receivedAtRaw ? new Date(receivedAtRaw) : null;

      const temperature_c = pickNumber(decoded, ["temperature_c", "temperatureC", "temp_c", "tempC", "temperature"]);
      const humidity_pct  = pickNumber(decoded, ["humidity_pct", "humidityPct", "humidity", "hum_pct", "humPct"]);
      const latitude_deg  = pickNumber(decoded, ["latitude_deg", "latitudeDeg", "lat_deg", "latDeg", "lat", "latitude"]);
      const longitude_deg = pickNumber(decoded, ["longitude_deg", "longitudeDeg", "lon_deg", "lonDeg", "lng", "lon", "longitude"]);
      const gas_ohms       = pickNumber(decoded, ["gas_ohms", "gasOhms", "gas", "gas_resistance", "gasResistance"]);

      // ✅ TRIM raw_payload for long-term storage
      const trimmedRaw = {
        device_id: deviceId,
        received_at: receivedAtRaw,
        f_cnt: uplink?.f_cnt ?? null,
        f_port: uplink?.f_port ?? null,
        frm_payload: uplink?.frm_payload ?? null,
        decoded_payload: uplink?.decoded_payload ?? null,
        settings: uplink?.settings ?? null,
        rx_metadata: (uplink?.rx_metadata || []).map((m: any) => ({
          rssi: m?.rssi ?? null,
          snr: m?.snr ?? null,
          gateway_id: m?.gateway_ids?.gateway_id ?? null,
          time: m?.time ?? null,
        })),
      };

      const sql = `
        INSERT INTO ttn_uplinks (
          device_id,
          f_cnt,
          f_port,
          received_at,
          temperature_c,
          humidity_pct,
          latitude_deg,
          longitude_deg,
          gas_ohms,
          raw_payload
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (device_id, f_cnt) DO NOTHING
        RETURNING id
      `;

      const values = [
        deviceId,
        uplink?.f_cnt ?? null,
        uplink?.f_port ?? null,
        receivedAt,
        temperature_c,
        humidity_pct,
        latitude_deg,
        longitude_deg,
        gas_ohms,
        trimmedRaw, // ✅ store trimmed jsonb instead of full msg
      ];

      const result = await pool.query(sql, values);

      if (result.rowCount === 0) {
        console.log(`↩️ Duplicate ignored: ${deviceId} f_cnt=${uplink?.f_cnt}`);
      } else {
  const uplinkId = result.rows[0].id;

  const upsertStateSql = `
    INSERT INTO device_state (
      device_id,
      last_received_at,
      latitude_deg,
      longitude_deg,
      temperature_c,
      humidity_pct,
      gas_ohms,
      last_uplink_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (device_id) DO UPDATE SET
      last_received_at = EXCLUDED.last_received_at,
      latitude_deg     = COALESCE(EXCLUDED.latitude_deg, device_state.latitude_deg),
      longitude_deg    = COALESCE(EXCLUDED.longitude_deg, device_state.longitude_deg),
      temperature_c    = COALESCE(EXCLUDED.temperature_c, device_state.temperature_c),
      humidity_pct     = COALESCE(EXCLUDED.humidity_pct, device_state.humidity_pct),
      gas_ohms         = COALESCE(EXCLUDED.gas_ohms, device_state.gas_ohms),
      last_uplink_id   = EXCLUDED.last_uplink_id
  `;

  await pool.query(upsertStateSql, [
    deviceId,
    receivedAt,
    latitude_deg,
    longitude_deg,
    temperature_c,
    humidity_pct,
    gas_ohms,
    uplinkId
  ]);

  console.log(`🧭 Updated device_state device=${deviceId} last_uplink_id=${uplinkId}`);
}
    } catch (err: any) {
      console.error("❌ Failed to insert uplink:", {
        message: err?.message,
        code: err?.code,
        detail: err?.detail,
        constraint: err?.constraint,
      });
    }
  });

  client.on("error", (err) => {
    console.error("MQTT error:", err.message);
  });

  client.on("close", () => {
    console.log("MQTT connection closed");
  });
}

/* 
docker compose exec postgres psql -U postgres -d postgres when youre in /api
to check the ttn_uplinks table, run:

SELECT
  id,
  device_id,
  f_cnt,
  f_port,
  received_at,
  temperature_c,
  humidity_pct,
  latitude_deg,
  longitude_deg,
  gas_ohms,
  inserted_at,
  pg_column_size(raw_payload) AS raw_payload_bytes
FROM public.ttn_uplinks
ORDER BY inserted_at DESC
LIMIT 20;
*/