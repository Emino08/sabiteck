-- Seed data for Academic Credentials Verification Platform
-- Version: 1.0
-- Created: 2025-09-16

USE credential_verification;

-- Insert super admin user
INSERT INTO users (name, email, password_hash, role, is_active, email_verified_at) VALUES
('System Administrator', 'admin@credentials.gov', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1, NOW());

-- Insert sample institutions (replace with real institutions)
INSERT INTO institutions (name, accreditation_id, domain_email, contact_name, contact_email, address, is_verified, is_active) VALUES
('National University', 'UNIV-001', 'admin@national-university.edu', 'Dr. John Smith', 'registrar@national-university.edu', '123 University Ave, Capital City', 1, 1),
('State College of Technology', 'TECH-002', 'admin@statetech.edu', 'Prof. Jane Doe', 'records@statetech.edu', '456 Tech Blvd, Tech City', 1, 1),
('Metropolitan Institute', 'METRO-003', 'admin@metro-institute.edu', 'Dr. Bob Wilson', 'admissions@metro-institute.edu', '789 Metro Street, Metro City', 1, 1),
('Regional Community College', 'RCC-004', 'admin@regional-cc.edu', 'Ms. Alice Brown', 'registrar@regional-cc.edu', '321 College Road, Regional Town', 1, 1),
('International Business School', 'IBS-005', 'admin@ibs.edu', 'Dr. David Lee', 'records@ibs.edu', '654 Business Ave, Commerce City', 1, 1);

-- Insert institution admins for each institution
INSERT INTO users (institution_id, name, email, password_hash, role, is_active, email_verified_at) VALUES
(1, 'National University Admin', 'admin@national-university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'institution_admin', 1, NOW()),
(2, 'State Tech Admin', 'admin@statetech.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'institution_admin', 1, NOW()),
(3, 'Metro Institute Admin', 'admin@metro-institute.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'institution_admin', 1, NOW()),
(4, 'Regional CC Admin', 'admin@regional-cc.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'institution_admin', 1, NOW()),
(5, 'IBS Admin', 'admin@ibs.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'institution_admin', 1, NOW());

-- Insert sample staff users
INSERT INTO users (institution_id, name, email, password_hash, role, permissions, is_active, email_verified_at) VALUES
(1, 'John Records Manager', 'records1@national-university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '["create_record", "edit_record", "view_audit_logs"]', 1, NOW()),
(1, 'Jane Certification Officer', 'cert1@national-university.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '["create_record", "approve_record", "revoke_record"]', 1, NOW()),
(2, 'Mike Data Entry', 'data@statetech.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '["create_record", "edit_record"]', 1, NOW()),
(3, 'Sarah Registrar', 'sarah@metro-institute.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', '["create_record", "edit_record", "approve_record", "view_audit_logs"]', 1, NOW());

-- Insert default notification templates
INSERT INTO notification_templates (institution_id, type, subject, body, variables, is_active) VALUES
(NULL, 'verification_request', 'New Verification Request', 'A new verification request has been submitted for credential {{certificate_code}} by {{requester_email}}. Reason: {{reason}}. Please review and approve/deny this request.', '["certificate_code", "requester_email", "reason"]', 1),
(NULL, 'verification_approved', 'Verification Request Approved', 'Your verification request for credential {{certificate_code}} has been approved. You can now access the full details using this link: {{access_link}}', '["certificate_code", "access_link"]', 1),
(NULL, 'verification_denied', 'Verification Request Denied', 'Your verification request for credential {{certificate_code}} has been denied. Reason: {{denial_reason}}', '["certificate_code", "denial_reason"]', 1),
(NULL, 'user_invite', 'Invitation to Credential Verification Platform', 'You have been invited to join the Academic Credentials Verification Platform for {{institution_name}}. Please click this link to set up your account: {{setup_link}}', '["institution_name", "setup_link"]', 1),
(NULL, 'credential_revoked', 'Credential Revoked', 'Credential {{certificate_code}} for {{student_name}} has been revoked. Reason: {{revocation_reason}}', '["certificate_code", "student_name", "revocation_reason"]', 1);

-- Insert sample credentials (for demonstration)
INSERT INTO credentials (institution_id, student_name, student_id, program_name, program_type, award_grade, graduation_date, certificate_code, verification_slug, status, record_type, public_summary, created_by) VALUES
(1, 'Alice Johnson', 'STU001', 'Computer Science', 'degree', 'First Class Honours', '2024-06-15', 'NU-CS-2024-001', 'nu-cs-alice-johnson', 'valid', 'certificate', 'Bachelor of Science in Computer Science with First Class Honours', 2),
(1, 'Bob Smith', 'STU002', 'Business Administration', 'degree', 'Second Class Upper', '2024-06-15', 'NU-BA-2024-002', 'nu-ba-bob-smith', 'valid', 'certificate', 'Bachelor of Business Administration with Second Class Upper Division', 2),
(2, 'Carol Williams', 'TECH001', 'Software Engineering', 'diploma', 'Distinction', '2024-05-30', 'ST-SE-2024-001', 'st-se-carol-williams', 'valid', 'certificate', 'Diploma in Software Engineering with Distinction', 3),
(3, 'David Brown', 'MET001', 'Project Management', 'certificate', 'Pass', '2024-07-20', 'MI-PM-2024-001', 'mi-pm-david-brown', 'valid', 'certificate', 'Certificate in Project Management', 5),
(4, 'Emma Davis', 'RCC001', 'Nursing', 'diploma', 'Merit', '2024-04-25', 'RCC-NUR-2024-001', 'rcc-nur-emma-davis', 'valid', 'certificate', 'Diploma in Nursing with Merit', 6);

-- Insert audit logs for the sample data
INSERT INTO audit_logs (actor_user_id, institution_id, credential_id, action, entity_type, entity_id, ip_address) VALUES
(2, 1, 1, 'credential_created', 'credential', 1, '192.168.1.100'),
(2, 1, 2, 'credential_created', 'credential', 2, '192.168.1.100'),
(3, 2, 3, 'credential_created', 'credential', 3, '192.168.1.101'),
(5, 3, 4, 'credential_created', 'credential', 4, '192.168.1.102'),
(6, 4, 5, 'credential_created', 'credential', 5, '192.168.1.103');

-- Insert system configuration settings
INSERT INTO institutions (name, accreditation_id, domain_email, settings, is_verified, is_active) VALUES
('System Configuration', 'SYS-CONFIG', 'system@credentials.gov', '{"verification_cache_ttl": 300, "max_file_size": 10485760, "allowed_file_types": ["pdf", "jpg", "png"], "rate_limit_per_minute": 60, "blockchain_enabled": false}', 1, 1)
ON DUPLICATE KEY UPDATE settings = VALUES(settings);