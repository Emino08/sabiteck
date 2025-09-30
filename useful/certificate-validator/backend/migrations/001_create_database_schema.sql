-- Academic Credentials Verification Platform Database Schema
-- Version: 1.0
-- Created: 2025-09-16

-- Create database
CREATE DATABASE IF NOT EXISTS credential_verification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE credential_verification;

-- Institutions table
CREATE TABLE institutions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    accreditation_id VARCHAR(128) NULL,
    domain_email VARCHAR(255) NULL,
    contact_name VARCHAR(255) NULL,
    contact_phone VARCHAR(64) NULL,
    contact_email VARCHAR(255) NULL,
    address TEXT NULL,
    logo_path VARCHAR(512) NULL,
    is_verified TINYINT DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    settings JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_domain_email (domain_email),
    INDEX idx_accreditation_id (accreditation_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Users table (institution admins and staff)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    institution_id INT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'institution_admin', 'staff', 'readonly') NOT NULL DEFAULT 'staff',
    permissions JSON NULL,
    mfa_secret VARCHAR(255) NULL,
    is_active TINYINT DEFAULT 1,
    email_verified_at DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    INDEX idx_institution_id (institution_id),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Credentials table
CREATE TABLE credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    institution_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(128) NULL,
    program_name VARCHAR(255) NULL,
    program_type ENUM('certificate', 'diploma', 'degree', 'postgraduate') NULL,
    award_grade VARCHAR(128) NULL,
    graduation_date DATE NULL,
    certificate_code VARCHAR(128) NOT NULL UNIQUE,
    verification_slug VARCHAR(128) NOT NULL UNIQUE,
    qr_code_path VARCHAR(512) NULL,
    status ENUM('valid', 'revoked', 'pending', 'draft') NOT NULL DEFAULT 'valid',
    record_type ENUM('certificate', 'transcript', 'dissertation', 'project') NOT NULL DEFAULT 'certificate',
    file_path VARCHAR(512) NULL,
    file_hash VARCHAR(128) NULL,
    public_summary TEXT NULL,
    metadata JSON NULL,
    digital_signature TEXT NULL,
    blockchain_hash VARCHAR(128) NULL,
    created_by INT NOT NULL,
    approved_by INT NULL,
    revoked_by INT NULL,
    revoked_at DATETIME NULL,
    revoked_reason TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_institution_id (institution_id),
    INDEX idx_certificate_code (certificate_code),
    INDEX idx_verification_slug (verification_slug),
    INDEX idx_student_name (student_name),
    INDEX idx_status (status),
    INDEX idx_record_type (record_type),
    INDEX idx_graduation_date (graduation_date),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_student_search (student_name, student_id, program_name)
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    actor_user_id INT NULL,
    institution_id INT NULL,
    credential_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id INT NULL,
    metadata JSON NULL,
    ip_address VARCHAR(64) NULL,
    user_agent TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE SET NULL,
    INDEX idx_actor_user_id (actor_user_id),
    INDEX idx_institution_id (institution_id),
    INDEX idx_credential_id (credential_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Verification requests table
CREATE TABLE verification_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    credential_id INT NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255) NULL,
    requester_organization VARCHAR(255) NULL,
    reason TEXT NULL,
    status ENUM('requested', 'approved', 'denied', 'expired') DEFAULT 'requested',
    access_token VARCHAR(128) NULL UNIQUE,
    approved_by INT NULL,
    approved_at DATETIME NULL,
    expires_at DATETIME NULL,
    accessed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (credential_id) REFERENCES credentials(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_credential_id (credential_id),
    INDEX idx_requester_email (requester_email),
    INDEX idx_status (status),
    INDEX idx_access_token (access_token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Rate limiting table
CREATE TABLE rate_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identifier VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL,
    attempts INT DEFAULT 0,
    window_start DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_rate_limit (identifier, action, window_start),
    INDEX idx_window_start (window_start)
) ENGINE=InnoDB;

-- API keys table for trusted partners
CREATE TABLE api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    institution_id INT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSON NULL,
    rate_limit_per_hour INT DEFAULT 1000,
    is_active TINYINT DEFAULT 1,
    last_used_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_institution_id (institution_id),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Cache table for verification results
CREATE TABLE verification_cache (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    data JSON NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- Notification templates table
CREATE TABLE notification_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    institution_id INT NULL,
    type VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSON NULL,
    is_active TINYINT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_institution_id (institution_id),
    INDEX idx_type (type)
) ENGINE=InnoDB;