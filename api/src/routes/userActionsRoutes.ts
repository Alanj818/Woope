import express from "express";
const pool = require("../db");

const router = express.Router();

// GET all logs
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ua.id,
             ua.user_id,
             ua.action,
             ua.action_time
      FROM user_actions ua
      ORDER BY ua.action_time DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

module.exports = router;