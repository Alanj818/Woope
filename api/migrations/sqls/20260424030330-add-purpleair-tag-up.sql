INSERT INTO tags (name) VALUES ('Purple Air')
ON CONFLICT (name) DO NOTHING;