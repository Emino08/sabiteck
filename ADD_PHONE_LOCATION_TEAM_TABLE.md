# Add Phone and Location to TEAM Table - Complete Guide

## Overview
This guide shows you how to add `phone` and `location` columns to the `team` table using phpMyAdmin or any MySQL client.

## Step 1: Check Current Table Structure

### Using phpMyAdmin:
1. Open phpMyAdmin in your browser
2. Select your database (`devco_db`)
3. Click on the `team` table in the left sidebar
4. Click the **"Structure"** tab
5. Look at all the columns currently in the table

### Or run this SQL:
Copy and paste this into phpMyAdmin SQL tab:
```sql
DESCRIBE team;
```

## Step 2: Add Phone and Location Columns

### Using phpMyAdmin (Recommended):

**Option A: Use the SQL Tab**
1. Click on the `team` table
2. Click the **"SQL"** tab at the top
3. Copy and paste this SQL:

```sql
-- Add phone column
ALTER TABLE team 
ADD COLUMN phone VARCHAR(50) DEFAULT NULL COMMENT 'Contact phone number' 
AFTER email;

-- Add location column
ALTER TABLE team 
ADD COLUMN location VARCHAR(255) DEFAULT NULL COMMENT 'Geographic location or office' 
AFTER phone;

-- Verify
DESCRIBE team;
```

4. Click **"Go"** to execute

**Option B: Use the Structure Tab**
1. Click on the `team` table
2. Click the **"Structure"** tab
3. Scroll down and find the section "Add [number] column(s)"
4. Enter "2" and click **"Go"**
5. For the first column:
   - Name: `phone`
   - Type: `VARCHAR`
   - Length: `50`
   - Default: `NULL`
   - Null: ✓ (checked)
   - After column: Select `email`
6. For the second column:
   - Name: `location`
   - Type: `VARCHAR`
   - Length: `255`
   - Default: `NULL`
   - Null: ✓ (checked)
   - After column: Select `phone`
7. Click **"Save"**

## Step 3: Verify the Changes

Run this SQL in phpMyAdmin:

```sql
-- Check the new columns
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'team'
  AND COLUMN_NAME IN ('email', 'phone', 'location')
ORDER BY ORDINAL_POSITION;
```

You should see output like:
```
COLUMN_NAME | DATA_TYPE | LENGTH | IS_NULLABLE
email       | varchar   | 255    | YES
phone       | varchar   | 50     | YES
location    | varchar   | 255    | YES
```

## Step 4: View Current Data

```sql
SELECT id, name, email, phone, location FROM team;
```

Existing records will have `NULL` for phone and location (this is normal and expected).

## Step 5: Update Existing Team Members (Optional)

Add phone and location to your existing team members:

```sql
-- Example 1: Update specific member
UPDATE team 
SET 
    phone = '+232 78 618435',
    location = 'Sierra Leone'
WHERE id = 1;

-- Example 2: Update by name
UPDATE team 
SET 
    phone = '+44 20 7946 0958',
    location = 'London, UK'
WHERE name = 'Sarah Johnson';

-- Verify the update
SELECT id, name, phone, location FROM team WHERE phone IS NOT NULL;
```

## Step 6: Test Adding New Team Member

Using phpMyAdmin's Insert tab:
1. Click on the `team` table
2. Click **"Insert"** tab
3. Fill in the fields:
   - name: "Test User"
   - position: "Developer"
   - email: "test@example.com"
   - phone: "+1 555 123 4567"
   - location: "New York, USA"
   - skills: ["React", "Node.js"]
4. Click **"Go"**

Or use SQL:
```sql
INSERT INTO team (name, slug, position, email, phone, location, skills, active)
VALUES (
    'Test User',
    'test-user',
    'Developer',
    'test@example.com',
    '+1 555 123 4567',
    'New York, USA',
    '["React", "Node.js"]',
    1
);

-- Verify
SELECT * FROM team WHERE slug = 'test-user';
```

## Migration Files Provided

1. **check_team_table.sql**
   - Shows all columns in the team table
   - Checks if phone/location columns exist
   - Displays sample data

2. **add_phone_location_to_team.sql**
   - Adds phone and location columns
   - Verifies the addition
   - Shows sample data

## Expected Table Structure After Migration

```
+----------------+--------------+------+-----+---------+----------------+
| Field          | Type         | Null | Key | Default | Extra          |
+----------------+--------------+------+-----+---------+----------------+
| id             | int(11)      | NO   | PRI | NULL    | auto_increment |
| name           | varchar(255) | YES  |     | NULL    |                |
| position       | varchar(255) | YES  |     | NULL    |                |
| department     | varchar(100) | YES  |     | NULL    |                |
| bio            | text         | YES  |     | NULL    |                |
| email          | varchar(255) | YES  |     | NULL    |                |
| phone          | varchar(50)  | YES  |     | NULL    |                | <- NEW
| location       | varchar(255) | YES  |     | NULL    |                | <- NEW
| photo_url      | varchar(500) | YES  |     | NULL    |                |
| avatar         | varchar(500) | YES  |     | NULL    |                |
| skills         | json         | YES  |     | NULL    |                |
| active         | tinyint(1)   | YES  |     | 1       |                |
| featured       | tinyint(1)   | YES  |     | 0       |                |
| created_at     | timestamp    | YES  |     | CURRENT_TIMESTAMP |      |
| updated_at     | timestamp    | YES  |     | CURRENT_TIMESTAMP |      |
+----------------+--------------+------+-----+---------+----------------+
```

## Backend Code Updated

The following files have been updated to use the `team` table:
- ✅ `backend/src/Controllers/TeamController.php`
- ✅ `backend/src/Controllers/TeamMemberController.php`

All references to `team_members` have been changed to `team`.

## Phone Number Format Examples

```
+232 78 618435      (Sierra Leone)
+44 20 7946 0958    (UK)
+1 555 123 4567     (US)
+91 98765 43210     (India)
+86 138 0013 8000   (China)
```

## Location Format Examples

```
Sierra Leone
London, UK
New York, USA
Freetown, Sierra Leone
San Francisco, CA, USA
```

## Troubleshooting

### Error: "Duplicate column name 'phone'"
**Meaning:** Column already exists  
**Action:** Skip this step, the column is already there!

### Error: "Table 'team' doesn't exist"
**Solution:** Check if you're using the correct database. The table might be named differently.

### Columns added but not showing on website
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart your backend server
3. Check API response: Visit `http://localhost:8002/api/team` in browser

### phpMyAdmin shows "Error in processing request"
**Solution:**
1. Refresh phpMyAdmin
2. Log out and log back in
3. Try running SQL commands one at a time

## Testing the Integration

### Test 1: View in Admin Panel
1. Go to `http://localhost:5173/admin/team`
2. Click "Add Team Member"
3. Fill in all fields including phone and location
4. Click "Save"
5. Verify the member appears with phone and location

### Test 2: View on Public Page
1. Go to `http://localhost:5173/team`
2. Check that team members show phone icon and location icon
3. Verify phone and location display correctly

### Test 3: API Response
Visit: `http://localhost:8002/api/team`

You should see JSON like:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "position": "CEO",
      "email": "john@example.com",
      "phone": "+1 555 123 4567",
      "location": "New York, USA",
      ...
    }
  ]
}
```

## Summary

After completing these steps:
- ✅ `phone` column added to team table
- ✅ `location` column added to team table
- ✅ Backend controllers updated to use `team` table
- ✅ Frontend already displays phone and location
- ✅ Admin panel ready to accept phone and location
- ✅ No code changes needed beyond migration

You can now add phone numbers and locations to your team members!
