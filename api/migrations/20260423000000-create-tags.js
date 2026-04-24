'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
};

exports.up = function (db) {
    return db.runSql(`
    CREATE TABLE IF NOT EXISTS tags (
      tag_id  SERIAL PRIMARY KEY,
      name    VARCHAR(50) NOT NULL UNIQUE
    );

    INSERT INTO tags (name) VALUES
      ('General'),
      ('Environment'),
      ('Event'),
      ('Workshop'),
      ('Hazard'),
      ('Mutual Aid')
    ON CONFLICT (name) DO NOTHING;

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id  INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
      tag_id   INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS pin_tags (
      pin_id   INTEGER NOT NULL REFERENCES pins(pin_id) ON DELETE CASCADE,
      tag_id   INTEGER NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
      PRIMARY KEY (pin_id, tag_id)
    );
  `);
};

exports.down = function (db) {
    return db.runSql(`
    DROP TABLE IF EXISTS pin_tags;
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
  `);
};

exports._meta = {
    "version": 1
};