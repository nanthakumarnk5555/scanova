-- Scanova TimescaleDB Hypertable & Security Permission Initializer
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Append-Only Security Trigger on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'COMPLIANCE VIOLATION: audit_log records are strictly immutable and cannot be updated or deleted (FDA 21 CFR 820.198 / EU MDR PMCF Compliance)';
END;
$$ LANGUAGE plpgsql;

-- Restrict DB Role Grants in Production
-- REVOKE UPDATE, DELETE ON audit_log FROM scanova_app_user;
-- GRANT INSERT, SELECT ON audit_log TO scanova_app_user;
