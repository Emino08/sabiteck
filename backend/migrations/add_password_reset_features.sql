-- Password Resets Table Migration
-- Ensures the password_resets table has all required columns

-- Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `passcode` varchar(6) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  KEY `passcode` (`passcode`),
  KEY `expires_at` (`expires_at`),
  CONSTRAINT `password_resets_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add passcode column if it doesn't exist
ALTER TABLE `password_resets` 
ADD COLUMN IF NOT EXISTS `passcode` varchar(6) DEFAULT NULL AFTER `token`;

-- Add used column if it doesn't exist
ALTER TABLE `password_resets` 
ADD COLUMN IF NOT EXISTS `used` tinyint(1) DEFAULT 0 AFTER `expires_at`;

-- Add used_at column if it doesn't exist
ALTER TABLE `password_resets` 
ADD COLUMN IF NOT EXISTS `used_at` datetime DEFAULT NULL AFTER `used`;

-- Add index on passcode if it doesn't exist
CREATE INDEX IF NOT EXISTS `idx_passcode` ON `password_resets` (`passcode`);

-- Clean up expired and used tokens (older than 24 hours)
DELETE FROM `password_resets` 
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) 
   OR (used = 1 AND used_at < DATE_SUB(NOW(), INTERVAL 24 HOUR));
