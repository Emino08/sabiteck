# Diagnostic and Fix Guide - Phone, Location, Department Not Loading in Edit Form

## Problem
When clicking "Edit" on a team member in the admin panel, the phone, location, and department fields are empty even though data exists in the database.

## Step 1: Check Database Data

### Run the Diagnostic Tool
1. Open in browser: `http://localhost:8002/check_team_data.php`
2. This will show you:
   - If phone, location, department columns exist
   - What data is actually in the database
   - Sample API response

### Expected Output
You should see team members with data like:
```
ID | Name          | Department | Phone           | Location
1  | John Doe      | Executive  | +1 555 123 4567 | New York, USA
2  | Jane Smith    | Technology | +44 20 7946 0958| London, UK
```

### If Data is Missing
Run this SQL in phpMyAdmin:
```sql
UPDATE team 
SET 
    phone = '+232 78 618435',
    location = 'Sierra Leone',
    department = 'Executive'
WHERE id = 1;
```

## Step 2: Check API Response

### Test the Admin API
Open in browser: `http://localhost:8002/api/admin/team`

Expected response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "position": "CEO",
      "department": "Executive",
      "phone": "+1 555 123 4567",
      "location": "New York, USA",
      "email": "john@example.com",
      ...
    }
  ]
}
```

### If Fields Are Missing
The backend SQL query should use `SELECT *` to get all fields.

Check `backend/src/Controllers/TeamMemberController.php`:
```php
// Should be:
$stmt = $this->db->query("SELECT * FROM team ORDER BY id DESC");

// NOT:
$stmt = $this->db->query("SELECT id, name, position FROM team..."); // Missing fields!
```

## Step 3: Check Frontend Data Loading

### Open Browser Console
1. Go to: `http://localhost:5173/admin/team`
2. Open browser console (F12)
3. Look for these console logs:
   - "API Response:"
   - "Raw members from API:"
   - "Mapped member:"

### What to Look For
Check if the mapped member has phone, department, location:
```javascript
Mapped member: {
  id: 1,
  name: "John Doe",
  department: "Executive",  // ← Should be here
  phone: "+1 555 123 4567", // ← Should be here
  location: "New York, USA" // ← Should be here
}
```

### If Fields Are Missing in Console
The `loadTeamMembers` function might not be mapping them correctly.

## Step 4: Check Edit Function

### Console Log the Edit Data
When you click "Edit", check console for currentMember state.

In browser console, type:
```javascript
// After clicking Edit, check the state
console.log(currentMember);
```

Expected output:
```javascript
{
  name: "John Doe",
  position: "CEO",
  department: "Executive",  // ← Should be populated
  phone: "+1 555 123 4567", // ← Should be populated
  location: "New York, USA" // ← Should be populated
  ...
}
```

## Step 5: Common Issues and Solutions

### Issue 1: Database columns don't exist
**Symptom**: check_team_data.php shows columns missing
**Solution**: Run migration SQL
```sql
ALTER TABLE team ADD COLUMN phone VARCHAR(50) AFTER email;
ALTER TABLE team ADD COLUMN location VARCHAR(255) AFTER phone;
-- department should already exist, but if not:
ALTER TABLE team ADD COLUMN department VARCHAR(100) AFTER position;
```

### Issue 2: Database has NULL values
**Symptom**: Columns exist but values are NULL
**Solution**: Update records with data
```sql
UPDATE team SET 
    phone = '+232 78 618435',
    location = 'Sierra Leone',
    department = 'Executive'
WHERE id = 1;
```

### Issue 3: API not returning fields
**Symptom**: Browser console shows data without phone/department/location
**Solution**: Check backend uses `SELECT *` in the query

### Issue 4: Frontend not mapping fields
**Symptom**: API returns data but edit form is empty
**Solution**: Already fixed in previous update, but verify editTeamMember function explicitly maps these fields

### Issue 5: Department dropdown empty
**Symptom**: Department field shows but dropdown is empty
**Solution**: Check the `departments` array is populated

The departments array should be:
```javascript
const departments = Array.from(
  new Set(teamMembers.map(m => m.department).filter(d => d))
);
```

Or hardcoded:
```javascript
const departments = ['Executive', 'Technology', 'Design', 'Marketing', 'Sales'];
```

## Step 6: Verify Form Fields

### Check Form Bindings
The form should have these fields bound to state:

```jsx
{/* Department Field */}
<select
  value={currentMember.department}
  onChange={(e) => setCurrentMember({...currentMember, department: e.target.value})}
>
  <option value="">Select department</option>
  {departments.map(dept => (
    <option key={dept} value={dept}>{dept}</option>
  ))}
</select>

{/* Phone Field */}
<Input
  value={currentMember.phone}
  onChange={(e) => setCurrentMember({...currentMember, phone: e.target.value})}
  placeholder="+1 (555) 123-4567"
/>

{/* Location Field */}
<Input
  value={currentMember.location}
  onChange={(e) => setCurrentMember({...currentMember, location: e.target.value})}
  placeholder="New York, USA"
/>
```

## Step 7: Force Refresh

### Clear Everything
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Restart backend server
4. Restart frontend server

## Debugging Checklist

Run through this checklist:

- [ ] Database columns exist (check_team_data.php)
- [ ] Database has data in these columns
- [ ] API endpoint returns these fields
- [ ] Browser console shows fields in API response
- [ ] loadTeamMembers maps these fields correctly
- [ ] editTeamMember sets these fields in state
- [ ] Form inputs are bound to currentMember state
- [ ] Department dropdown has options
- [ ] No console errors

## Quick Fix Script

If all else fails, add this debugging to TeamManagement.jsx:

```javascript
const editTeamMember = (member) => {
  console.log('=== EDIT TEAM MEMBER DEBUG ===');
  console.log('Original member:', member);
  console.log('Has phone?', member.phone);
  console.log('Has location?', member.location);
  console.log('Has department?', member.department);
  
  setEditingMember(member);
  
  const newState = {
    ...member,
    name: member.name || '',
    position: member.position || '',
    department: member.department || '',
    bio: member.bio || '',
    email: member.email || '',
    phone: member.phone || '',
    location: member.location || '',
    // ... rest of fields
  };
  
  console.log('New state:', newState);
  setCurrentMember(newState);
  setShowEditor(true);
};
```

This will show you exactly what data is being passed and what's being set in state.

## Expected Flow

1. Database has: `phone`, `location`, `department` columns with data
2. API returns: All fields including phone, location, department
3. Frontend loads: Maps all fields correctly
4. Click Edit: Sets all fields in currentMember state
5. Form displays: Shows all field values
6. Save: Sends all fields back to API

## Contact Points

If issue persists, check these files:

1. **Database**: Run check_team_data.php
2. **Backend**: TeamMemberController.php (line 23-27)
3. **Frontend Loading**: TeamManagement.jsx loadTeamMembers (line 55-82)
4. **Frontend Edit**: TeamManagement.jsx editTeamMember (line 248-278)
5. **Form Fields**: TeamManagement.jsx form section (line 471-565)

## Solution Summary

The fix already implemented should work if:
1. Database columns exist
2. Database has data
3. API returns the data
4. Frontend mapping is correct (already fixed)
5. Edit function sets fields (already fixed)
6. Form fields are bound (already present)

Run check_team_data.php to diagnose which step is failing!
