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
      SELECT
        device_id,
        last_received_at,
        latitude_deg  AS latitude,
        longitude_deg AS longitude,
        temperature_c,
        humidity_pct,
        gas_ohms,
        (now() - last_received_at) < interval '10 minutes' AS is_online
      FROM device_state
      WHERE latitude_deg IS NOT NULL
        AND longitude_deg IS NOT NULL
      ORDER BY last_received_at DESC
    `;

    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /ttn/devices failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;