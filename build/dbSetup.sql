CREATE SCHEMA IF NOT EXISTS schema_user;

DROP TABLE IF EXISTS schema_user;
CREATE TABLE schema_user.user (
  id        uuid      PRIMARY KEY REFERENCES auth.user(id) ON UPDATE CASCADE ON DELETE CASCADE,
  email     varchar   REFERENCES auth.user(email) ON UPDATE CASCADE,
  name      varchar   NOT NULL,
  callname  varchar   NOT NULL
);

DROP user service_user IF EXISTS;
CREATE user service_user;

GRANT USAGE ON SCHEMA schema_user TO service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_user TO service_user;
