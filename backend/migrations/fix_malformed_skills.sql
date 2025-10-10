-- ============================================================================
-- Clean Up Malformed Skills Data
-- Fixes double-encoded JSON skills in the database
-- ============================================================================

-- BEFORE running this, backup your data!
-- Run this to see current skills data:
SELECT id, name, skills FROM team;

-- ============================================================================
-- Option 1: Manual Fix for Specific Records
-- ============================================================================

-- Example of malformed data:
-- ["[\"UI Design\"", "\"UX Research\"", "\"Figma\""]
-- Should be: ["UI Design", "UX Research", "Figma"]

-- Fix specific record by ID:
UPDATE team 
SET skills = '["UI Design", "UX Research", "Figma", "Adobe Creative Suite", "Prototyping"]'
WHERE id = 1;

-- Replace '1' with your actual team member ID
-- Replace the skills array with the correct format for that member

-- ============================================================================
-- Option 2: If you know the correct skills for each member
-- ============================================================================

-- Update each team member with correct skills:

-- Example for team member ID 1:
UPDATE team 
SET skills = '["Leadership", "Mentorship", "Strategy", "Software Development"]'
WHERE id = 1;

-- Example for team member ID 2:
UPDATE team 
SET skills = '["UI Design", "UX Research", "Figma", "Adobe Creative Suite"]'
WHERE id = 2;

-- Example for team member ID 3:
UPDATE team 
SET skills = '["React", "Node.js", "Database Design", "API Development"]'
WHERE id = 3;

-- ============================================================================
-- Option 3: PHP Script to Clean All Records
-- ============================================================================

-- This SQL creates a temporary table and cleans the data
-- Note: This is a complex operation, use with caution!

/*
-- Create temporary table
CREATE TEMPORARY TABLE team_skills_backup AS 
SELECT id, name, skills FROM team;

-- You would need PHP to properly clean the JSON
-- See: backend/fix_skills_encoding.php
*/

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check current skills format:
SELECT 
    id, 
    name, 
    skills,
    CASE 
        WHEN skills LIKE '%\"[%' THEN 'MALFORMED - Has bracket quotes'
        WHEN skills LIKE '%\\\"%' THEN 'MALFORMED - Has escaped quotes'
        WHEN skills LIKE '[%]' AND skills NOT LIKE '%\"[%' THEN 'GOOD'
        ELSE 'UNKNOWN'
    END AS status
FROM team
WHERE skills IS NOT NULL;

-- Count malformed records:
SELECT COUNT(*) as malformed_count
FROM team
WHERE skills LIKE '%\"[%' OR skills LIKE '%\\\"%';

-- Show all skills that need fixing:
SELECT id, name, skills
FROM team
WHERE skills LIKE '%\"[%' OR skills LIKE '%\\\"%';

-- ============================================================================
-- After Fixing - Verify
-- ============================================================================

-- All skills should look like this:
-- ["Skill One", "Skill Two", "Skill Three"]

-- NOT like this:
-- ["[\"Skill One\"", "\"Skill Two\""]
-- [\"Skill One\", \"Skill Two\"]

SELECT id, name, skills FROM team;

-- ============================================================================
-- Examples of Correct Skills Format
-- ============================================================================

/*
Leadership Skills:
["Leadership", "Mentorship", "Strategy", "Business Development"]

Design Skills:
["UI Design", "UX Research", "Figma", "Adobe Creative Suite", "Prototyping"]

Development Skills:
["React", "Node.js", "TypeScript", "Database Design", "API Development"]

Marketing Skills:
["Digital Marketing", "SEO", "Content Strategy", "Social Media", "Analytics"]

*/

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

/*
1. Always backup your data before running UPDATE queries
2. Test on a single record first before updating all records
3. Use the verification queries to check results
4. The correct format is: ["Skill1", "Skill2", "Skill3"]
5. No extra quotes, no brackets around individual skills
6. No escaped quotes (\")
*/
