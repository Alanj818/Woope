import { Router } from "express";
const pool = require("../db");

const router = Router();

/**
 * GET /ttn/devices
 * Returns one row per device (latest known state) for map markers.
 */
router.get("/devices", async (_req, res) => {
  try {
    const sql = `
      SELECT DISTINCT ON (sl.sensor_id)
        s.id          AS sensor_id,
        s.name        AS device_id,
        sl.source_id,
        sl.received_at AS last_received_at,
        sl.latitude_deg  AS latitude,
        sl.longitude_deg AS longitude,
        sl.temperature_c,
        sl.humidity_pct,
        sl.gas_ohms,
        (now() - sl.received_at) < interval '10 minutes' AS is_online
      FROM sensor_logs sl
      JOIN sensors s ON s.id = sl.sensor_id
      WHERE sl.source = 'ttn'
        AND sl.latitude_deg IS NOT NULL
        AND sl.longitude_deg IS NOT NULL
      ORDER BY sl.sensor_id, sl.received_at DESC
    `;

    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /ttn/devices failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /ttn/devices/:sensorId
 * Returns the latest reading for a specific TTN device.
 */
router.get("/devices/:sensorId", async (req, res) => {
  try {
    const { sensorId } = req.params;

    const sql = `
      SELECT
        s.id          AS sensor_id,
        s.name        AS device_name,
        sl.source_id,
        sl.received_at AS last_received_at,
        sl.latitude_deg  AS latitude,
        sl.longitude_deg AS longitude,
        sl.temperature_c,
        sl.humidity_pct,
        sl.gas_ohms,
        (now() - sl.received_at) < interval '10 minutes' AS is_online
      FROM sensor_logs sl
      JOIN sensors s ON s.id = sl.sensor_id
      WHERE sl.sensor_id = $1 AND sl.source = 'ttn'
      ORDER BY sl.received_at DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(sql, [sensorId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ GET /ttn/devices/:sensorId failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;