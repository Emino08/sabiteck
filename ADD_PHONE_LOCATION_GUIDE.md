# Add Phone and Location Columns to Team Members Table

## Overview
This guide walks you through adding `phone` and `location` columns to your existing `team_members` table safely without breaking any code.

## Step 1: Check Current Table Structure

First, verify what columns currently exist in your table.

### Option A: Using SQL Script
```bash
# Run the check script
mysql -u root -p devco_db < backend/migrations/check_team_table_structure.sql
```

### Option B: Using MySQL Command Line
```sql
-- Connect to database
mysql -u root -p devco_db

-- Check table structure
DESCRIBE team_members;

-- Or get detailed info
SHOW FULL COLUMNS FROM team_members;
```

### Option C: Using phpMyAdmin
1. Open phpMyAdmin
2. Select your database (`devco_db`)
3. Click on `team_members` table
4. Click "Structure" tab
5. Look for `phone` and `location` columns

## Step 2: Add the Columns

Choose ONE of the following methods:

### Method 1: Simple ALTER TABLE (Recommended)

```bash
mysql -u root -p devco_db < backend/migrations/add_phone_location_simple.sql
```

**Note:** If columns already exist, you'll see an error message like:
```
ERROR 1060: Duplicate column name 'phone'
```
This is **safe to ignore** - it just means the columns are already there.

### Method 2: Safe IF NOT EXISTS (Advanced)

This method checks if columns exist before adding them:

```bash
mysql -u root -p devco_db < backend/migrations/add_phone_location_to_team_members.sql
```

This won't show any errors even if columns exist.

### Method 3: Manual SQL Commands

```sql
-- Connect to your database
mysql -u root -p devco_db

-- Add phone column
ALTER TABLE team_members 
ADD COLUMN phone VARCHAR(50) DEFAULT NULL COMMENT 'Contact phone number' 
AFTER email;

-- Add location column
ALTER TABLE team_members 
ADD COLUMN location VARCHAR(255) DEFAULT NULL COMMENT 'Geographic location or office' 
AFTER phone;

-- Verify
DESCRIBE team_members;
```

## Step 3: Verify the Changes

After running the migration, verify the columns were added:

### Check Table Structure
```sql
DESCRIBE team_members;
```

You should see output including:
```
+----------+--------------+------+-----+---------+-------+
| Field    | Type         | Null | Key | Default | Extra |
+----------+--------------+------+-----+---------+-------+
| email    | varchar(255) | YES  |     | NULL    |       |
| phone    | varchar(50)  | YES  |     | NULL    |       |
| location | varchar(255) | YES  |     | NULL    |       |
+----------+--------------+------+-----+---------+-------+
```

### Check Data
```sql
SELECT id, name, email, phone, location FROM team_members;
```

Initially, `phone` and `location` will be `NULL` for existing records.

## Step 4: Add Sample Data (Optional)

Update existing team members with phone and location:

```sql
-- Update specific team member
UPDATE team_members 
SET 
    phone = '+232 78 618435',
    location = 'Sierra Leone'
WHERE id = 1;

-- Update multiple members
UPDATE team_members 
SET 
    phone = '+44 20 7946 0958',
    location = 'London, UK'
WHERE id = 2;
```

## Column Specifications

### Phone Column
- **Type:** VARCHAR(50)
- **Nullable:** YES (NULL allowed)
- **Default:** NULL
- **Format:** International format recommended (e.g., +232 78 618435)
- **Examples:**
  - `+232 78 618435` (Sierra Leone)
  - `+44 20 7946 0958` (UK)
  - `+1 555 123 4567` (US)

### Location Column
- **Type:** VARCHAR(255)
- **Nullable:** YES (NULL allowed)
- **Default:** NULL
- **Format:** City, Country or Country only
- **Examples:**
  - `Sierra Leone`
  - `London, UK`
  - `New York, USA`
  - `Freetown, Sierra Leone`

## Backend Compatibility

The backend controllers already support these fields:

### TeamMemberController.php
- ✅ CREATE operation includes phone and location
- ✅ UPDATE operation includes phone and location
- ✅ Public API returns phone and location

### TeamController.php
- ✅ CREATE operation includes phone and location
- ✅ UPDATE operation includes phone and location

No code changes needed! The backend is already configured to work with these columns.

## Frontend Display

The frontend components already display phone and location:

### Public Team Page (`Team.jsx`)
```jsx
{member.phone && (
  <div className="flex items-center text-sm text-gray-600">
    <Phone className="h-4 w-4 text-blue-600 mr-3" />
    <span>{member.phone}</span>
  </div>
)}

{member.location && (
  <div className="flex items-center text-sm text-gray-600">
    <MapPin className="h-4 w-4 text-green-600 mr-3" />
    <span>{member.location}</span>
  </div>
)}
```

### Admin Panel (`TeamManagement.jsx`)
Form fields for phone and location are already included in the editor.

## Troubleshooting

### Error: "Duplicate column name 'phone'"
**Solution:** The column already exists. No action needed.

### Error: "Table 'team_members' doesn't exist"
**Solution:** Run the main migration first:
```bash
mysql -u root -p devco_db < backend/migrations/create_team_members_table.sql
```

### Error: "Access denied"
**Solution:** Check your MySQL credentials in `.env` file:
```
DB_HOST=localhost
DB_PORT=4306
DB_NAME=devco_db
DB_USER=root
DB_PASS=your_password
```

### Columns added but not showing in API response
**Solution:** 
1. Check backend is using the correct database
2. Restart your backend server
3. Clear any caches
4. Verify with: `SELECT * FROM team_members LIMIT 1;`

## Testing

### Test via SQL
```sql
-- Insert test record with phone and location
INSERT INTO team_members (name, slug, position, email, phone, location, skills, active)
VALUES (
    'Test User',
    'test-user',
    'Developer',
    'test@example.com',
    '+1 555 123 4567',
    'New York, USA',
    JSON_ARRAY('React', 'Node.js'),
    1
);

-- Verify
SELECT id, name, phone, location FROM team_members WHERE slug = 'test-user';
```

### Test via API
```bash
# Create team member with phone and location
curl -X POST http://localhost:8002/api/admin/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "position": "Manager",
    "email": "api@test.com",
    "phone": "+44 20 7946 0958",
    "location": "London, UK",
    "skills": ["Leadership", "Management"]
  }'
```

### Test via Admin Panel
1. Go to `http://localhost:5173/admin/team`
2. Click "Add Team Member"
3. Fill in all fields including phone and location
4. Click "Save"
5. Verify the member appears with phone and location

## Migration Files Reference

1. **check_team_table_structure.sql** - Check current table structure
2. **add_phone_location_simple.sql** - Simple ALTER TABLE script
3. **add_phone_location_to_team_members.sql** - Safe IF NOT EXISTS script
4. **create_team_members_table.sql** - Full table creation (includes phone/location)

## Summary

After running the migration:
- ✅ `phone` column added (VARCHAR 50)
- ✅ `location` column added (VARCHAR 255)
- ✅ Backend already supports these fields
- ✅ Frontend already displays these fields
- ✅ No code changes required
- ✅ Existing data preserved
- ✅ NULL values for existing records (can be updated later)

The phone and location fields are now fully integrated into your team management system!
