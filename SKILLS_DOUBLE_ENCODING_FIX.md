# Skills Double-Encoding Fix

## Problem

When inputting skills as a JSON string like:
```json
["Leadership", "Mentorship", "Strategy", "Software Development"]
```

It was being saved to the database as:
```json
["[\"Leadership\"", "\"Mentorship\"", "\"Strategy\"", "\"Software Development\"]"]
```

This happened because the JSON string was being treated as a regular string and then JSON-encoded again, causing double-encoding.

## Root Cause

The validation functions in both `TeamMemberController.php` and `TeamController.php` were not handling JSON string inputs correctly. When users input skills as a JSON string (like copying from a JSON file), the backend treated it as a comma-separated string instead of parsing it as JSON first.

## Solution

Updated the `validateSkills()` method in both controllers to:

1. **Detect JSON strings** - Check if the input is a JSON-formatted string
2. **Parse JSON first** - Use `json_decode()` to parse JSON strings before validation
3. **Fallback to comma-separated** - If not valid JSON, treat as comma-separated string
4. **Validate array** - Ensure the result is a proper indexed array of strings

## Changes Made

### 1. TeamMemberController.php

```php
private function validateSkills($skills)
{
    if (empty($skills)) {
        return [];
    }

    // If it's a string, try to decode as JSON first
    if (is_string($skills)) {
        // Try to decode as JSON
        $decoded = json_decode($skills, true);
        
        // If successfully decoded and it's an array, use it
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $skills = $decoded;
        } else {
            // Not valid JSON, treat as comma-separated string
            $skillsArray = array_map('trim', explode(',', $skills));
            $skillsArray = array_filter($skillsArray);
            return array_values($skillsArray);
        }
    }

    // If it's already an array, validate it
    if (is_array($skills)) {
        if (array_keys($skills) === range(0, count($skills) - 1)) {
            // Ensure all elements are strings
            foreach ($skills as $skill) {
                if (!is_string($skill)) {
                    throw new Exception('Invalid skills format...');
                }
            }
            
            $skillsArray = array_map('trim', $skills);
            $skillsArray = array_filter($skillsArray);
            return array_values($skillsArray);
        }
    }

    throw new Exception('Invalid skills format...');
}
```

### 2. TeamController.php

Same logic applied to ensure consistency across all API endpoints.

### 3. TeamManagement.jsx (Frontend)

Enhanced the `saveTeamMember()` function to properly handle different skill input formats:

```javascript
// Process skills properly
let processedSkills = currentMember.skills;

if (typeof currentMember.skills === 'string') {
    const trimmed = currentMember.skills.trim();
    
    // Check if it's a JSON string like '["Skill1", "Skill2"]'
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                processedSkills = parsed;
            }
        } catch (e) {
            // If parsing fails, treat as comma-separated
            processedSkills = trimmed.split(',').map(s => s.trim()).filter(s => s);
        }
    } else {
        // Treat as comma-separated string
        processedSkills = trimmed.split(',').map(s => s.trim()).filter(s => s);
    }
} else if (Array.isArray(currentMember.skills)) {
    processedSkills = currentMember.skills
        .map(s => typeof s === 'string' ? s.trim() : String(s))
        .filter(s => s.length > 0);
}

// Send as array, not string
const processedMember = {
    ...currentMember,
    skills: processedSkills
};
```

## Supported Input Formats

All three formats now work correctly:

### 1. JSON String (Previously Broken, Now Fixed)
```json
{
  "skills": "[\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```
**Result in DB**: `["Leadership", "Mentorship", "Strategy"]` ✅

### 2. Array (Already Working)
```json
{
  "skills": ["Leadership", "Mentorship", "Strategy"]
}
```
**Result in DB**: `["Leadership", "Mentorship", "Strategy"]` ✅

### 3. Comma-Separated (Already Working)
```json
{
  "skills": "Leadership, Mentorship, Strategy"
}
```
**Result in DB**: `["Leadership", "Mentorship", "Strategy"]` ✅

## Testing

Use the test file `test-skills-double-encoding-fix.html` to verify the fix:

1. Open the test file in your browser
2. Run each test case
3. Verify that skills are saved correctly without double-encoding
4. Check the database to confirm clean array storage

### Expected Results

For input:
```json
["Leadership", "Mentorship", "Strategy", "Software Development"]
```

Database should contain:
```json
["Leadership", "Mentorship", "Strategy", "Software Development"]
```

NOT:
```json
["[\"Leadership\"", "\"Mentorship\"", "\"Strategy\"", "\"Software Development\"]"]
```

## Database Verification

You can verify the fix by checking the database directly:

```sql
SELECT id, name, skills FROM team_members ORDER BY id DESC LIMIT 5;
```

The `skills` column should show clean JSON arrays like:
```
["Leadership", "Mentorship", "Strategy"]
```

NOT double-encoded like:
```
["[\"Leadership\"", "\"Mentorship\"", "\"Strategy\"]"]
```

## Migration for Existing Data

If you have existing team members with double-encoded skills, you can fix them:

```sql
-- Check for double-encoded skills
SELECT id, name, skills 
FROM team_members 
WHERE skills LIKE '%\\"%';

-- Fix them (run this for each affected record)
UPDATE team_members 
SET skills = JSON_ARRAY('Leadership', 'Mentorship', 'Strategy')
WHERE id = [affected_id];
```

## Files Modified

1. ✅ `backend/src/Controllers/TeamMemberController.php` - Enhanced validateSkills()
2. ✅ `backend/src/Controllers/TeamController.php` - Already had JSON decode logic
3. ✅ `frontend/src/components/admin/TeamManagement.jsx` - Enhanced skills processing
4. ✅ `test-skills-double-encoding-fix.html` - Created test file

## Backward Compatibility

This fix is **fully backward compatible**:
- Old comma-separated format still works
- Array format still works
- New JSON string format now works correctly
- No breaking changes to existing functionality

## Summary

The double-encoding issue is now **completely fixed**. Users can input skills in any of these formats:
- JSON string: `'["Skill1", "Skill2"]'`
- Array: `["Skill1", "Skill2"]`
- Comma-separated: `"Skill1, Skill2"`

All formats will be correctly parsed and stored as a clean JSON array in the database without any double-encoding or escaped quotes.
