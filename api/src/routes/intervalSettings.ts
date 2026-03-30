import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import fs from 'fs';
import path from 'path';
import { fetchAndLogPurpleAirData } from '../services/purpleAirService';

const router = express.Router();
const CONFIG_PATH = path.join(__dirname, '../config.json');

// GET /settings/poll-interval
router.get('/poll-interval', authenticateToken, async (req: Request, res: Response) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    res.json({ pollIntervalMinutes: config.pollIntervalMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// PUT /settings/poll-interval
router.put('/poll-interval', authenticateToken, async (req: Request, res: Response) => {
  const { pollIntervalMinutes } = req.body;

  if (!pollIntervalMinutes || !Number.isInteger(pollIntervalMinutes) || pollIntervalMinutes < 1) {
    return res.status(400).json({ error: 'pollIntervalMinutes must be a positive integer' });
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    config.pollIntervalMinutes = pollIntervalMinutes;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    res.json({ pollIntervalMinutes });

    // Trigger immediate poll in background
    fetchAndLogPurpleAirData().catch(err => console.error('Failed to trigger poll:', err));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

export default router;