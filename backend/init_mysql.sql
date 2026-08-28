-- Scanova Medical AI Post-Deployment Surveillance & Diagnostics Platform
-- MySQL DDL Schema Initialization Script
-- Author: Lattice Health Systems

CREATE DATABASE IF NOT EXISTS scanova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE scanova_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'clinician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. Uploaded Images / Studies Table
CREATE TABLE IF NOT EXISTS uploaded_images (
    id VARCHAR(36) PRIMARY KEY,
    accession_number VARCHAR(100) NOT NULL UNIQUE,
    patient_id_hash VARCHAR(64) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    patient_age INT DEFAULT 52,
    patient_sex VARCHAR(10) DEFAULT 'M',
    site_id VARCHAR(100) DEFAULT 'Main Hospital',
    scanner_manufacturer VARCHAR(100) DEFAULT 'Siemens Healthineers',
    uploaded_by_user_id VARCHAR(36),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_upload_accession (accession_number),
    INDEX idx_upload_created (created_at)
) ENGINE=InnoDB;

-- 3. Predictions Table (DenseNet-121 outputs)
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(36) PRIMARY KEY,
    image_id VARCHAR(36) NOT NULL,
    model_name VARCHAR(100) NOT NULL DEFAULT 'DenseNet-121',
    model_version VARCHAR(50) NOT NULL DEFAULT 'v1.2.0-CheXNet-Pneumonia',
    prediction_label VARCHAR(50) NOT NULL,
    confidence_score FLOAT NOT NULL,
    raw_probabilities JSON,
    gradcam_path VARCHAR(500),
    inference_latency_ms FLOAT DEFAULT 0.0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES uploaded_images(id) ON DELETE CASCADE,
    INDEX idx_prediction_image (image_id),
    INDEX idx_prediction_created (created_at)
) ENGINE=InnoDB;

-- 4. Radiologist Reports Table (Ground Truth)
CREATE TABLE IF NOT EXISTS radiologist_reports (
    id VARCHAR(36) PRIMARY KEY,
    image_id VARCHAR(36) NOT NULL,
    radiologist_user_id VARCHAR(36),
    radiologist_id_code VARCHAR(100) NOT NULL,
    radiologist_name VARCHAR(255) NOT NULL,
    finding_label VARCHAR(50) NOT NULL,
    confidence_level VARCHAR(50) DEFAULT 'High',
    clinical_notes TEXT,
    agreement_status VARCHAR(50) NOT NULL,
    discordance_type VARCHAR(50) DEFAULT 'None',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES uploaded_images(id) ON DELETE CASCADE,
    FOREIGN KEY (radiologist_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_rad_image (image_id),
    INDEX idx_rad_agreement (agreement_status)
) ENGINE=InnoDB;

-- 5. Performance Metrics Table (AI Monitoring Agent output)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id VARCHAR(36) PRIMARY KEY,
    window_type VARCHAR(50) NOT NULL,
    window_start DATETIME NOT NULL,
    window_end DATETIME NOT NULL,
    sample_size INT NOT NULL,
    true_positives INT DEFAULT 0,
    false_positives INT DEFAULT 0,
    true_negatives INT DEFAULT 0,
    false_negatives INT DEFAULT 0,
    accuracy FLOAT NOT NULL,
    sensitivity FLOAT NOT NULL,
    specificity FLOAT NOT NULL,
    ppv FLOAT NOT NULL,
    npv FLOAT NOT NULL,
    f1_score FLOAT NOT NULL,
    cohen_kappa FLOAT NOT NULL,
    roc_auc FLOAT DEFAULT 0.0,
    confusion_matrix JSON,
    computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_perf_window (window_type, computed_at)
) ENGINE=InnoDB;

-- 6. Drift Events Table (PSI / KS-Test checks)
CREATE TABLE IF NOT EXISTS drift_events (
    id VARCHAR(36) PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,
    psi_score FLOAT NOT NULL,
    ks_statistic FLOAT NOT NULL,
    ks_p_value FLOAT NOT NULL,
    kl_divergence FLOAT NOT NULL,
    drift_status VARCHAR(50) NOT NULL,
    distribution_baseline JSON,
    distribution_current JSON,
    summary JSON,
    computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_drift_computed (computed_at),
    INDEX idx_drift_status (drift_status)
) ENGINE=InnoDB;

-- 7. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    trigger_details JSON,
    status VARCHAR(50) DEFAULT 'Open',
    sla_hours INT DEFAULT 24,
    sla_expires_at DATETIME NOT NULL,
    assigned_to_user_id VARCHAR(36),
    resolution_notes TEXT,
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_alert_status_sev (status, severity),
    INDEX idx_alert_created (created_at)
) ENGINE=InnoDB;

-- 8. Audit Logs Table (Tamper-evident log)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action_summary VARCHAR(255) NOT NULL,
    payload JSON,
    sha256_hash VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_time (created_at)
) ENGINE=InnoDB;
