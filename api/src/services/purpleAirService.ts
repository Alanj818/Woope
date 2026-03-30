import axios from "axios";
const pool = require("../db");

const PURPLE_AIR_URL = "https://api.purpleair.com/v1/sensors";

const ONE_HOUR = 60 * 60 * 1000;

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

async function fetchAndLogPurpleAirData() {
    try {
    const PURPLE_AIR_API_KEY = process.env.PURPLE_AIR_API_KEY;
    console.log("🟣 API KEY:", PURPLE_AIR_API_KEY); // debug
    // Step 1: Get all PurpleAir sensors from our sensors table
    const sensorsResult = await pool.query(
    `SELECT id, source_id, name FROM sensors WHERE source = 'purpleair'`
    );

    if (sensorsResult.rows.length === 0) {
    console.log("No PurpleAir sensors found in sensors table");
    return;
    }

    // Step 2: Build show_only list from source_ids
    const showOnly = sensorsResult.rows.map((s: any) => s.source_id).join(",");


    console.log("🟣 show_only:", showOnly);
    console.log("🟣 fields:", FIELDS);

    // Step 3: One API call to PurpleAir for all sensors
    const response = await axios.get(PURPLE_AIR_URL, {
        headers: { "X-API-Key": PURPLE_AIR_API_KEY },
        params: {
        fields: FIELDS,
        show_only: showOnly,
    },
    });

    const { fields, data } = response.data;

    // Step 4: Map field names to indexes for easy lookup
    const idx = (name: string) => fields.indexOf(name);

    // Step 5: Loop through each sensor response and log it
    for (const row of data) {
      const sensorIndex = String(row[0]); // sensor_index is always first

      // Find the matching sensor in our table
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

export function startPurpleAirJob() {
console.log("🟣 Starting PurpleAir hourly job");

  // Run immediately on startup
fetchAndLogPurpleAirData();

  // Then run every hour
setInterval(fetchAndLogPurpleAirData, ONE_HOUR);
}