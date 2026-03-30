CREATE TABLE device_state (
  device_id TEXT PRIMARY KEY,
  last_received_at TIMESTAMPTZ,
  latitude_deg DOUBLE PRECISION,
  longitude_deg DOUBLE PRECISION,
  temperature_c DOUBLE PRECISION,
  humidity_pct DOUBLE PRECISION,
  gas_ohms DOUBLE PRECISION,
  last_uplink_id BIGINT
);

CREATE INDEX idx_device_state_last_received
  ON device_state(last_received_at DESC);