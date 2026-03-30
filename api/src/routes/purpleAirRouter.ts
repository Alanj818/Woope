import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getPurpleAirSensorLocation } from '../services/purpleAirService';

const pool = require('../db');
const router = express.Router();

// ─── SENSOR CRUD ─────────────────────────────────────────────────────────────

// GET /purpleair/sensors - get all registered PurpleAir sensors
router.get('/sensors', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
  `SELECT s.id, s.source, s.source_id, s.name, 
  COALESCE(s.latitude, MAX(sl.latitude_deg)) AS latitude,
  COALESCE(s.longitude, MAX(sl.longitude_deg)) AS longitude,
  s.inserted_at,
  MAX(sl.received_at) AS last_seen
  FROM sensors s
  LEFT JOIN sensor_logs sl ON sl.sensor_id = s.id
  WHERE s.deleted_at IS NULL
  GROUP BY s.id
  ORDER BY s.inserted_at DESC`
);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch PurpleAir sensors' });
  }
});

// POST /purpleair/sensors - register a new PurpleAir sensor
router.post('/sensors', authenticateToken, async (req: Request, res: Response) => {
  const { name, purpleAirSensorId } = req.body;

  if (!name || !purpleAirSensorId) {
    return res.status(400).json({
      error: 'name and purpleAirSensorId are required'
    });
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  if (!/^\d+$/.test(purpleAirSensorId)) {
    return res.status(400).json({ error: 'purpleAirSensorId must be a numeric string' });
  }

  try {
    const { latitude, longitude } = await getPurpleAirSensorLocation(purpleAirSensorId);

    const result = await pool.query(
      `INSERT INTO sensors (source, source_id, name, latitude, longitude)
       VALUES ('purpleair', $1, $2, $3, $4)
       ON CONFLICT (source, source_id) DO UPDATE
       SET deleted_at = NULL,
           name = EXCLUDED.name,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude
       WHERE sensors.deleted_at IS NOT NULL
       RETURNING id, source, source_id, name, latitude, longitude, inserted_at`,
      [purpleAirSensorId, name.trim(), latitude, longitude]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Sensor already exists' });
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Failed to create PurpleAir sensor' });
  }
});

// PUT /purpleair/sensors/:id - update a sensor, but not latitude/longitude
router.put('/sensors/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, purpleAirSensorId, latitude, longitude } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid sensor ID' });
  }

  if (latitude !== undefined || longitude !== undefined) {
    return res.status(400).json({
      error: 'latitude and longitude cannot be updated after creation'
    });
  }

  if (!name || !purpleAirSensorId) {
    return res.status(400).json({ error: 'name and purpleAirSensorId are required' });
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  if (!/^\d+$/.test(purpleAirSensorId)) {
    return res.status(400).json({ error: 'purpleAirSensorId must be a numeric string' });
  }

  try {
    const result = await pool.query(
      `UPDATE sensors
       SET name = $1, source_id = $2
       WHERE id = $3 AND source = 'purpleair' AND deleted_at IS NULL
       RETURNING id, source, source_id, name, latitude, longitude, inserted_at`,
      [name.trim(), purpleAirSensorId, Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update PurpleAir sensor' });
  }
});

// DELETE /purpleair/sensors/:id - soft delete a sensor
router.delete('/sensors/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ error: 'Invalid sensor ID' });
  }

  try {
    const result = await pool.query(
      `UPDATE sensors
       SET deleted_at = now()
       WHERE id = $1 AND source = 'purpleair' AND deleted_at IS NULL
       RETURNING id`,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete PurpleAir sensor' });
  }
});

// ─── DATA ROUTES ─────────────────────────────────────────────────────────────

// GET /purpleair/devices - returns latest reading for all active sensors
router.get('/devices', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (sensor_id)
        sl.sensor_id,
        sl.source_id,
        s.name,
        s.latitude,
        s.longitude,
        sl.received_at,
        sl.latitude_deg,
        sl.longitude_deg,
        sl.temperature_c,
        sl.humidity_pct,
        sl.pressure_mb,
        sl.pm1_0,
        sl.pm2_5_atm,
        sl.pm2_5_cf1,
        sl.pm10_0,
        sl.voc
       FROM sensor_logs sl
       JOIN sensors s ON s.id = sl.sensor_id
       WHERE sl.source = 'purpleair' AND s.deleted_at IS NULL
       ORDER BY sensor_id, sl.received_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch PurpleAir data' });
  }
});

// GET /purpleair/devices/:sensorId - returns latest reading for a specific active sensor
router.get('/devices/:sensorId', async (req: Request, res: Response) => {
  try {
    const { sensorId } = req.params;

    const result = await pool.query(
      `SELECT
        sl.sensor_id,
        sl.source_id,
        s.name,
        s.latitude,
        s.longitude,
        sl.received_at,
        sl.latitude_deg,
        sl.longitude_deg,
        sl.temperature_c,
        sl.humidity_pct,
        sl.pressure_mb,
        sl.pm1_0,
        sl.pm2_5_atm,
        sl.pm2_5_cf1,
        sl.pm10_0,
        sl.voc
       FROM sensor_logs sl
       JOIN sensors s ON s.id = sl.sensor_id
       WHERE sl.sensor_id = $1 AND sl.source = 'purpleair' AND s.deleted_at IS NULL
       ORDER BY sl.received_at DESC
       LIMIT 1`,
      [sensorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

export default router;