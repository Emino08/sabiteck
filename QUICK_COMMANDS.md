# Quick Command Reference - Add Phone & Location Columns

## Execute Migration (Choose One)

### Option 1: Simple Method (Recommended)
```bash
mysql -u root -p devco_db < backend/migrations/add_phone_location_simple.sql
```

### Option 2: Safe Method (No errors)
```bash
mysql -u root -p devco_db < backend/migrations/add_phone_location_to_team_members.sql
```

### Option 3: Manual Commands
```bash
mysql -u root -p devco_db
```
Then run:
```sql
ALTER TABLE team_members ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER email;
ALTER TABLE team_members ADD COLUMN location VARCHAR(255) DEFAULT NULL AFTER phone;
DESCRIBE team_members;
exit;
```

## Verify Migration

```bash
# Check table structure
mysql -u root -p devco_db -e "DESCRIBE team_members;"

# Check data
mysql -u root -p devco_db -e "SELECT id, name, email, phone, location FROM team_members LIMIT 5;"
```

## Update Existing Data

```sql
-- Single update
UPDATE team_members 
SET phone = '+232 78 618435', location = 'Sierra Leone'
WHERE id = 1;

-- Multiple updates
UPDATE team_members SET phone = '+44 20 7946 0958', location = 'London, UK' WHERE id = 2;
UPDATE team_members SET phone = '+1 555 123 4567', location = 'New York, USA' WHERE id = 3;
```

## Test via API

```bash
# Create team member with phone and location
curl -X POST http://localhost:8002/api/admin/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "position": "Developer",
    "email": "test@example.com",
    "phone": "+1 555 000 1111",
    "location": "Seattle, USA",
    "skills": ["React", "Node.js"]
  }'
```

## Rollback (If Needed)

If you need to remove the columns:
```sql
ALTER TABLE team_members DROP COLUMN phone;
ALTER TABLE team_members DROP COLUMN location;
```

## Files Created

- ✅ `check_team_table_structure.sql` - Check current structure
- ✅ `add_phone_location_simple.sql` - Simple migration
- ✅ `add_phone_location_to_team_members.sql` - Safe migration
- ✅ `ADD_PHONE_LOCATION_GUIDE.md` - Complete guide
- ✅ `QUICK_COMMANDS.md` - This file

## Status Check

After running migration, verify:
```bash
# 1. Check columns exist
mysql -u root -p devco_db -e "SHOW COLUMNS FROM team_members LIKE 'phone';"
mysql -u root -p devco_db -e "SHOW COLUMNS FROM team_members LIKE 'location';"

# 2. Test create via admin panel
# Navigate to: http://localhost:5173/admin/team
# Add new member with phone and location

# 3. Check public page
# Navigate to: http://localhost:5173/team
# Verify phone and location display
```

## Troubleshooting

### Error: Duplicate column name
**Meaning:** Column already exists  
**Action:** No action needed - columns are already there!

### Error: Table doesn't exist
**Solution:** Create table first:
```bash
mysql -u root -p devco_db < backend/migrations/create_team_members_table.sql
```

### Columns added but not showing in frontend
**Solution:**
1. Restart backend server
2. Clear browser cache
3. Check API response: `curl http://localhost:8002/api/team`
