import axios from "axios";
import fs from "fs";
import path from "path";
const pool = require("../db");

const PURPLE_AIR_URL = "https://api.purpleair.com/v1/sensors";
const CONFIG_PATH = path.join(__dirname, "../config.json");

const FIELDS = [
  "latitude",
  "longitude",
  "pm1.0",
  "pm2.5_atm",
  "pm2.5_cf_1",
  "pm10.0",
  "temperature",
  "humidity",
  "pressure",
  "voc",
].join(",");

function getPollInterval(): number {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    return (config.pollIntervalMinutes || 60) * 60 * 1000;
  } catch {
    return 60 * 60 * 1000;
  }
}

export async function fetchAndLogPurpleAirData() {
  try {
    const PURPLE_AIR_API_KEY = process.env.PURPLE_AIR_API_KEY;

    if (!PURPLE_AIR_API_KEY) {
      throw new Error("PURPLE_AIR_API_KEY is not configured");
    }

    console.log("🟣 PurpleAir API key configured:", !!PURPLE_AIR_API_KEY);

    const sensorsResult = await pool.query(
      `SELECT id, source_id, name
       FROM sensors
       WHERE source = 'purpleair' AND deleted_at IS NULL`
    );

    if (sensorsResult.rows.length === 0) {
      console.log("No PurpleAir sensors found in sensors table");
      return;
    }

    const showOnly = sensorsResult.rows.map((s: any) => s.source_id).join(",");

    console.log("🟣 show_only:", showOnly);
    console.log("🟣 fields:", FIELDS);

    const response = await axios.get(PURPLE_AIR_URL, {
      headers: { "X-API-Key": PURPLE_AIR_API_KEY },
      params: {
        fields: FIELDS,
        show_only: showOnly,
      },
    });

    const { fields, data } = response.data;
    const idx = (name: string) => fields.indexOf(name);

    for (const row of data) {
      const sensorIndex = String(row[0]);

      const sensor = sensorsResult.rows.find(
        (s: any) => s.source_id === sensorIndex
      );

      if (!sensor) continue;

      await pool.query(
        `INSERT INTO sensor_logs (
          sensor_id,
          source,
          source_id,
          received_at,
          latitude_deg,
          longitude_deg,
          temperature_c,
          humidity_pct,
          pressure_mb,
          pm1_0,
          pm2_5_atm,
          pm2_5_cf1,
          pm10_0,
          voc
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT DO NOTHING`,
        [
          sensor.id,
          "purpleair",
          sensorIndex,
          new Date(),
          row[idx("latitude")],
          row[idx("longitude")],
          row[idx("temperature")],
          row[idx("humidity")],
          row[idx("pressure")],
          row[idx("pm1.0")],
          row[idx("pm2.5_atm")],
          row[idx("pm2.5_cf_1")],
          row[idx("pm10.0")],
          row[idx("voc")],
        ]
      );

      console.log(`✅ Logged PurpleAir data: sensor_id=${sensor.id} source_id=${sensorIndex}`);
    }
  } catch (err: any) {
    console.error("❌ Full error:", err?.response?.data);
    console.error("❌ Failed to fetch/log PurpleAir data:", {
      message: err?.message,
      code: err?.code,
    });
  }
}

export async function getPurpleAirSensorLocation(sensorId: string) {
  const PURPLE_AIR_API_KEY = process.env.PURPLE_AIR_API_KEY;

  if (!PURPLE_AIR_API_KEY) {
    throw new Error("PURPLE_AIR_API_KEY is not configured");
  }

  const response = await axios.get(`${PURPLE_AIR_URL}/${sensorId}`, {
    headers: { "X-API-Key": PURPLE_AIR_API_KEY },
    params: {
      fields: "latitude,longitude",
    },
  });

  const sensor = response.data?.sensor ?? response.data;

  if (!sensor) {
    throw new Error("PurpleAir sensor not found");
  }

  const latitude = Number(sensor.latitude);
  const longitude = Number(sensor.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("PurpleAir returned invalid latitude");
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("PurpleAir returned invalid longitude");
  }

  return { latitude, longitude };
}

export function startPurpleAirJob() {
  console.log("🟣 Starting PurpleAir job");

  fetchAndLogPurpleAirData();

  const schedule = () => {
    const interval = getPollInterval();
    console.log(`🟣 Next poll in ${interval / 60000} minutes`);
    setTimeout(() => {
      fetchAndLogPurpleAirData();
      schedule();
    }, interval);
  };

  schedule();
}