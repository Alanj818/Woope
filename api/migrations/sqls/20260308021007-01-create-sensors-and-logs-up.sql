-- Migration 1: Create sensors and sensor_logs tables

CREATE TABLE sensors (
    id          SERIAL PRIMARY KEY,
    source      TEXT NOT NULL,
    source_id   TEXT NOT NULL,
    name        TEXT,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(source, source_id)
);

CREATE TABLE sensor_logs (
    id            BIGSERIAL PRIMARY KEY,
    sensor_id     INTEGER NOT NULL REFERENCES sensors(id),
    source        TEXT NOT NULL,
    source_id     TEXT NOT NULL,
    received_at   TIMESTAMPTZ NOT NULL,
    inserted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Location
    latitude_deg  DOUBLE PRECISION,
    longitude_deg DOUBLE PRECISION,

    -- Environmental (shared)
    temperature_c DOUBLE PRECISION,
    humidity_pct  DOUBLE PRECISION,
    pressure_mb   DOUBLE PRECISION,

    -- TTN-specific
    f_cnt         INTEGER,
    f_port        INTEGER,
    gas_ohms      DOUBLE PRECISION,
    raw_payload   JSONB,

    -- PurpleAir-specific
    pm1_0         DOUBLE PRECISION,
    pm2_5_atm     DOUBLE PRECISION,
    pm2_5_cf1     DOUBLE PRECISION,
    pm10_0        DOUBLE PRECISION,
    voc           DOUBLE PRECISION,
    ozone         DOUBLE PRECISION
);

-- Indexes
CREATE UNIQUE INDEX uq_sensor_logs_ttn
    ON sensor_logs(sensor_id, f_cnt)
    WHERE source = 'ttn';

CREATE UNIQUE INDEX uq_sensor_logs_purpleair
    ON sensor_logs(sensor_id, received_at)
    WHERE source = 'purpleair';

CREATE INDEX idx_sensor_logs_sensor_time
    ON sensor_logs(sensor_id, received_at DESC);

CREATE INDEX idx_sensor_logs_received
    ON sensor_logs(received_at DESC);

CREATE INDEX idx_sensor_logs_source
    ON sensor_logs(source, source_id);