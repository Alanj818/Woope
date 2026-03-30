DROP INDEX IF EXISTS idx_sensors_active;

ALTER TABLE sensors
    DROP COLUMN deleted_at;