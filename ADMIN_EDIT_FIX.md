# Admin Edit Team - Phone, Department, Location Fix

## Problem
When editing a team member in the admin panel, the phone, department, and location fields were not loading the data from the backend.

## Solution Implemented

### 1. Updated `editTeamMember` Function
**File**: `frontend/src/components/admin/TeamManagement.jsx`

**Before:**
```javascript
const editTeamMember = (member) => {
  setEditingMember(member);
  setCurrentMember({
    ...member,
    skills: Array.isArray(member.skills) ? member.skills.join(', ') : (member.skills || ''),
    certifications: Array.isArray(member.certifications)
      ? member.certifications.join('\n')
      : (member.certifications || '')
  });
  setShowEditor(true);
};
```

**After:**
```javascript
const editTeamMember = (member) => {
  setEditingMember(member);
  setCurrentMember({
    ...member,
    // Explicitly map all fields to ensure they're loaded
    name: member.name || '',
    position: member.position || '',
    department: member.department || '',  // ← Fixed
    bio: member.bio || '',
    email: member.email || '',
    phone: member.phone || '',            // ← Fixed
    location: member.location || '',      // ← Fixed
    photo_url: member.photo_url || member.avatar || '',
    linkedin_url: member.linkedin_url || '',
    twitter_url: member.twitter_url || '',
    website_url: member.website_url || '',
    years_experience: member.years_experience || '',
    education: member.education || '',
    active: member.active !== undefined ? member.active : true,
    featured: member.featured !== undefined ? member.featured : false,
    order_position: member.order_position || member.sort_order || 0,
    skills: Array.isArray(member.skills) ? member.skills.join(', ') : (member.skills || ''),
    certifications: Array.isArray(member.certifications)
      ? member.certifications.join('\n')
      : (member.certifications || '')
  });
  setPhotoPreview(null);
  setShowEditor(true);
};
```

### 2. Enhanced `loadTeamMembers` Function
Added explicit mapping for:
- `phone`
- `location`
- `department`

And added console logging for debugging:
```javascript
console.log('API Response:', response);
console.log('Raw members from API:', members);
console.log('Mapped member:', mapped);
```

### 3. Updated Fallback Data
Added phone numbers to fallback sample data:
- Alpha Ousman Barrie: `+232 78 618435`
- Sarah Johnson: `+44 20 7946 0958`
- Mohamed Kamara: `+232 76 123456`

## Testing

### Test 1: Check Browser Console
1. Open admin panel: `http://localhost:5173/admin/team`
2. Open browser console (F12)
3. Look for console logs:
   - "API Response:" - Shows the raw API response
   - "Raw members from API:" - Shows data before mapping
   - "Mapped member:" - Shows data after mapping

### Test 2: Edit Team Member
1. Click "Edit" on any team member
2. Check if these fields are populated:
   - ✅ Name
   - ✅ Position
   - ✅ Department
   - ✅ Phone
   - ✅ Location
   - ✅ Email
   - ✅ Bio
   - ✅ Skills

### Test 3: Verify Data from Backend
Check the API directly:
```bash
# Open in browser or curl
curl http://localhost:8002/api/admin/team
```

Expected response should include:
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

## Debugging Steps

If fields are still not loading:

### Step 1: Check API Response
Open browser console and look for the "API Response:" log.

**If you see `success: false`:**
- Backend is not returning data correctly
- Check backend server is running
- Verify database has team records

**If you see `success: true` but data is empty:**
- Database might be empty
- Check: `SELECT * FROM team;` in phpMyAdmin

### Step 2: Check Field Mapping
Look for "Mapped member:" in console.

**Verify these fields exist:**
```javascript
{
  phone: "+1 555 123 4567",
  location: "New York, USA",
  department: "Executive"
}
```

**If fields are missing or null:**
- Database columns might not exist
- Run migration: `add_phone_location_to_team.sql`

### Step 3: Check Edit Function
Click Edit and check console for the `currentMember` state.

In browser console, type:
```javascript
// This will show current state
console.log(currentMember);
```

Should show all fields populated.

## Common Issues & Solutions

### Issue 1: Phone/Location Not Showing
**Cause**: Database columns don't exist  
**Solution**: Run the migration SQL in phpMyAdmin
```sql
ALTER TABLE team ADD COLUMN phone VARCHAR(50) AFTER email;
ALTER TABLE team ADD COLUMN location VARCHAR(255) AFTER phone;
```

### Issue 2: Fields Show as NULL
**Cause**: Database records have NULL values  
**Solution**: Update records with data
```sql
UPDATE team SET phone = '+1 555 0000', location = 'City, Country' WHERE id = 1;
```

### Issue 3: Department Not Loading
**Cause**: Department column might have different name  
**Solution**: Check actual column name
```sql
DESCRIBE team;
```

### Issue 4: Edit Form Shows Old Data
**Cause**: Browser cache  
**Solution**: 
1. Hard refresh (Ctrl+Shift+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Restart development server

## Files Modified

1. **frontend/src/components/admin/TeamManagement.jsx**
   - Updated `editTeamMember` function
   - Enhanced `loadTeamMembers` function
   - Added console logging for debugging
   - Updated fallback data

## Verification Checklist

- [ ] Backend returns phone, department, location in API response
- [ ] Frontend loads data from API correctly
- [ ] Edit form populates all fields
- [ ] Phone field shows in edit form
- [ ] Location field shows in edit form
- [ ] Department field shows in edit form
- [ ] Data saves correctly when updated
- [ ] No console errors

## Next Steps

1. **Test the fix:**
   - Open admin panel
   - Click Edit on a team member
   - Verify all fields load correctly

2. **If still not working:**
   - Check browser console for errors
   - Check the console logs for API response
   - Verify database has the columns
   - Contact support with console logs

3. **After verification:**
   - Remove console.log statements (optional)
   - Test create/update operations
   - Verify data persists after save

## Status

✅ Fix implemented  
✅ Console logging added for debugging  
✅ Fallback data updated  
✅ All fields explicitly mapped  

**Ready for testing!**
