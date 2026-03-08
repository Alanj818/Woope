const pool = require('../db');

export async function getPurpleAirPins() {
    const results = await pool.query(
        `SELECT id, name, purple_air_sensor_id FROM purpleair_pins`
    );

    return results.rows;
}

export async function createPurpleAirPin(
  name: string,
  purpleAirSensorId: string
) {
  const result = await pool.query(
    `INSERT INTO purpleair_pins (name, purple_air_sensor_id)
     VALUES ($1, $2)
     RETURNING id, name, purple_air_sensor_id`,
    [name, purpleAirSensorId]
  );

  return result.rows[0];
}

export async function updatePurpleAirPin(
  id: number,
  name: string,
  purpleAirSensorId: string
) {
  const result = await pool.query(
    `UPDATE purpleair_pins
     SET name = $1, purple_air_sensor_id = $2
     WHERE id = $3
     RETURNING id, name, purple_air_sensor_id`,
    [name, purpleAirSensorId, id]
  );

  return result.rows[0];
}

export async function deletePurpleAirPin(id: number) {
  await pool.query(
    `DELETE FROM purpleair_pins WHERE id = $1`,
    [id]
  );
}