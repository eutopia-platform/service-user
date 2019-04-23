CREATE SCHEMA IF NOT EXISTS sc_user;

DROP TABLE IF EXISTS sc_user;
CREATE TABLE sc_user.user (
  uid       char(20)      PRIMARY KEY,
  email     varchar(70)   UNIQUE NOT NULL,
  name      varchar(70),
  callname  varchar(70)
);

DROP USER IF EXISTS service_user;
CREATE USER service_user;

GRANT USAGE ON SCHEMA sc_user TO service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sc_user TO service_user;
