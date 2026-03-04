CREATE TABLE IF NOT EXISTS ttn_uplinks (
  id            BIGSERIAL PRIMARY KEY,
  device_id     TEXT NOT NULL,
  f_cnt         INTEGER,
  f_port        INTEGER,
  received_at   TIMESTAMPTZ,
  temperature_c DOUBLE PRECISION,
  humidity_pct  DOUBLE PRECISION,
  latitude_deg  DOUBLE PRECISION,
  longitude_deg DOUBLE PRECISION,
  gas_ohms      DOUBLE PRECISION,
  raw_payload   JSONB NOT NULL,
  inserted_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ttn_uplinks_device_fcnt
  ON ttn_uplinks(device_id, f_cnt);

CREATE INDEX IF NOT EXISTS idx_ttn_uplinks_device_time
  ON ttn_uplinks(device_id, received_at DESC);