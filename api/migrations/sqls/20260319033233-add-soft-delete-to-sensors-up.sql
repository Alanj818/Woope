ALTER TABLE sensors
    ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_sensors_active
    ON sensors(deleted_at)
    WHERE deleted_at IS NULL;