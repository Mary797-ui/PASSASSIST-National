-- PASSASSIST National relational schema (PostgreSQL starter).
-- Personal data is intentionally minimised. Apply migrations through a reviewed process.
CREATE TABLE districts (
  district_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE offices (
  office_id BIGSERIAL PRIMARY KEY,
  district_id BIGINT NOT NULL REFERENCES districts(district_id),
  name VARCHAR(120) NOT NULL,
  office_type VARCHAR(20) NOT NULL CHECK (office_type IN ('DISTRICT','SATELLITE')),
  contact_phone VARCHAR(30),
  address_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE roles (
  role_id BIGSERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE permissions (
  permission_id BIGSERIAL PRIMARY KEY,
  permission_code VARCHAR(80) NOT NULL UNIQUE,
  description TEXT NOT NULL
);
CREATE TABLE role_permissions (
  role_id BIGINT REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id BIGINT REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);
CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  email VARCHAR(254) UNIQUE,
  password_hash TEXT NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(role_id),
  office_id BIGINT REFERENCES offices(office_id),
  account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (account_status IN ('PENDING','ACTIVE','LOCKED','DISABLED')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE applications (
  application_id UUID PRIMARY KEY,
  office_id BIGINT NOT NULL REFERENCES offices(office_id),
  application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('NEW','REPLACEMENT','MINOR')),
  received_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(30) NOT NULL,
  data_classification VARCHAR(20) NOT NULL DEFAULT 'CONFIDENTIAL'
    CHECK (data_classification IN ('PUBLIC','PRIVATE','CONFIDENTIAL','RESTRICTED'))
);
CREATE TABLE processing_events (
  event_id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(application_id),
  event_type VARCHAR(40) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  actor_user_id UUID REFERENCES users(user_id),
  event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_hash CHAR(64),
  previous_hash CHAR(64)
);
CREATE TABLE production_daily (
  production_id BIGSERIAL PRIMARY KEY,
  office_id BIGINT NOT NULL REFERENCES offices(office_id),
  report_date DATE NOT NULL,
  applications_received INTEGER NOT NULL DEFAULT 0 CHECK (applications_received >= 0),
  applications_processed INTEGER NOT NULL DEFAULT 0 CHECK (applications_processed >= 0),
  applications_approved INTEGER NOT NULL DEFAULT 0 CHECK (applications_approved >= 0),
  passports_printed INTEGER NOT NULL DEFAULT 0 CHECK (passports_printed >= 0),
  passports_collected INTEGER NOT NULL DEFAULT 0 CHECK (passports_collected >= 0),
  outstanding_backlog INTEGER NOT NULL DEFAULT 0 CHECK (outstanding_backlog >= 0),
  UNIQUE(office_id, report_date)
);
CREATE TABLE audit_logs (
  audit_id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(user_id),
  action_code VARCHAR(80) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_ref VARCHAR(120),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome VARCHAR(20) NOT NULL,
  integrity_hash CHAR(64)
);
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX idx_apps_office_received ON applications(office_id, received_at);
CREATE INDEX idx_events_application_time ON processing_events(application_id, occurred_at);
CREATE INDEX idx_production_office_date ON production_daily(office_id, report_date);
