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
      const gas_ohms      = pickNumber(decoded, ["gas_ohms", "gasOhms", "gas", "gas_resistance", "gasResistance"]);
      const pm1_0         = pickNumber(decoded, ["pm1_0"]);
      const pm2_5_atm     = pickNumber(decoded, ["pm2_5_atm"]);
      const pm10_0        = pickNumber(decoded, ["pm10_0"]);

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

      // Step 1: Get or create sensor
      const sensorResult = await pool.query(
        `INSERT INTO sensors (source, source_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (source, source_id) DO UPDATE SET source = EXCLUDED.source
        RETURNING id`,
        ["ttn", deviceId, deviceId]
      );

      const sensorId = sensorResult.rows[0].id;

      // Step 2: Insert log
      const logResult = await pool.query(
        `INSERT INTO sensor_logs (
          sensor_id,
          source,
          source_id,
          received_at,
          latitude_deg,
          longitude_deg,
          temperature_c,
          humidity_pct,
          gas_ohms,
          f_cnt,
          f_port,
          raw_payload,
          pm1_0,
          pm2_5_atm,
          pm10_0
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          sensorId,
          "ttn",
          deviceId,
          receivedAt,
          latitude_deg,
          longitude_deg,
          temperature_c,
          humidity_pct,
          gas_ohms,
          uplink?.f_cnt ?? null,
          uplink?.f_port ?? null,
          trimmedRaw,
          pm1_0,
          pm2_5_atm,
          pm10_0,
        ]
      );

      if (logResult.rowCount === 0) {
        console.log(`↩️ Duplicate ignored: ${deviceId} f_cnt=${uplink?.f_cnt}`);
      } else {
        console.log(`✅ Logged TTN uplink: sensor_id=${sensorId} device=${deviceId} f_cnt=${uplink?.f_cnt}`);
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