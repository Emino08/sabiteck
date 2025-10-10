# Quick Fix for Existing Double-Encoded Skills

If you already have team members with double-encoded skills in the database, here's how to fix them:

## Check for Double-Encoded Skills

```sql
-- Find affected records
SELECT id, name, skills 
FROM team_members 
WHERE skills LIKE '%\\"%' OR skills LIKE '%["%';
```

## Fix Individual Record

### Option 1: Update with specific skills
```sql
UPDATE team_members 
SET skills = JSON_ARRAY('Leadership', 'Mentorship', 'Strategy', 'Software Development', 'Business Development', 'Digital Media', 'Product Innovation', 'Education')
WHERE id = 1;
```

### Option 2: Use your specific skills
Replace the skills array with your actual skills:

```sql
UPDATE team_members 
SET skills = JSON_ARRAY(
    'Leadership',
    'Mentorship', 
    'Strategy',
    'Software Development',
    'Business Development',
    'Digital Media',
    'Product Innovation',
    'Education'
)
WHERE id = [YOUR_TEAM_MEMBER_ID];
```

## Fix Multiple Records at Once

If you have multiple records with the same issue:

```sql
-- For CEO/Executive team members
UPDATE team_members 
SET skills = JSON_ARRAY('Leadership', 'Strategy', 'Business Development')
WHERE department = 'Executive' AND skills LIKE '%\\"%';

-- For Technology team members
UPDATE team_members 
SET skills = JSON_ARRAY('Software Development', 'Product Innovation', 'Technology')
WHERE department = 'Technology' AND skills LIKE '%\\"%';
```

## Verify the Fix

After updating, verify the skills are correct:

```sql
-- Check updated records
SELECT id, name, skills 
FROM team_members 
WHERE id IN (1, 2, 3);  -- Replace with your IDs
```

Should display clean JSON like:
```
["Leadership", "Mentorship", "Strategy"]
```

NOT:
```
["[\"Leadership\"", "\"Mentorship\"", "\"Strategy\"]"]
```

## Using the Admin Panel

Alternatively, you can fix it through the admin panel:

1. Go to `/admin/team`
2. Click "Edit" on the affected team member
3. The skills field will show the current (broken) values
4. Clear the skills field
5. Enter skills in any of these formats:
   - Array: `["Leadership", "Mentorship", "Strategy"]`
   - Comma-separated: `Leadership, Mentorship, Strategy`
6. Click "Update Team Member"

The new validation will automatically fix the double-encoding.

## Prevention

Going forward, the double-encoding issue is prevented by:
- ✅ Enhanced backend validation (detects and parses JSON strings)
- ✅ Enhanced frontend processing (sends clean arrays)
- ✅ All three input formats work correctly

You won't encounter this issue again with new or updated team members!
