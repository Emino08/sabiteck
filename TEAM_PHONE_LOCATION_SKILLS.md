# Team Members - Phone, Location & Skills Validation

## Overview
This document explains the implementation of phone number, location fields, and strict skills validation in the team members system.

## Database Fields

### New/Updated Fields

#### Phone Number
- **Field**: `phone`
- **Type**: `varchar(50)`
- **Description**: Contact phone number for team member
- **Format**: International format recommended
- **Example**: `+232 78 618435`, `+44 20 7946 0958`, `+1 555 123 4567`
- **Nullable**: Yes
- **Usage**: Displayed on public team page and admin panel

#### Location
- **Field**: `location`
- **Type**: `varchar(255)`
- **Description**: Geographic location or office location
- **Format**: City, Country or just Country
- **Example**: `Sierra Leone`, `London, UK`, `Freetown, Sierra Leone`
- **Nullable**: Yes
- **Usage**: Displayed on public team page with location icon

#### Skills (Enhanced Validation)
- **Field**: `skills`
- **Type**: `json`
- **Description**: Array of skill names
- **Format**: **STRICT** - Must be JSON array of strings
- **Example**: `["Leadership", "Mentorship", "Strategy", "Software Development"]`
- **Nullable**: Yes
- **Validation**: Enforced on create and update operations

## Skills Validation

### Required Format

Skills **MUST** be in this exact format:

```json
["Leadership", "Mentorship", "Strategy", "Software Development", "Business Development"]
```

### Validation Rules

1. **Must be an array** - Not a string, not an object
2. **Must be indexed array** - Not an associative array
3. **Must contain strings only** - No numbers, no objects, no nulls
4. **Empty values filtered out** - Empty strings are removed
5. **Trimmed automatically** - Leading/trailing spaces removed

### Accepted Input Formats

The API will accept and convert the following formats:

#### 1. Array of Strings (Preferred)
```json
{
  "skills": ["Leadership", "Mentorship", "Strategy"]
}
```

#### 2. Comma-Separated String (Auto-converted)
```json
{
  "skills": "Leadership, Mentorship, Strategy"
}
```

#### 3. JSON String (Auto-parsed)
```json
{
  "skills": "[\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

### Rejected Formats

These formats will **REJECT** the request with error:

#### ❌ Associative Array
```json
{
  "skills": {
    "0": "Leadership",
    "1": "Mentorship"
  }
}
```

#### ❌ Array with Non-String Values
```json
{
  "skills": ["Leadership", 123, null, true]
}
```

#### ❌ Nested Arrays
```json
{
  "skills": [["Leadership"], ["Mentorship"]]
}
```

## API Validation

### Create Team Member

**Endpoint**: `POST /api/admin/team`

**Request Example**:
```json
{
  "name": "John Doe",
  "position": "Software Engineer",
  "department": "Technology",
  "bio": "Expert developer with 10+ years experience",
  "email": "john@company.com",
  "phone": "+1 555 123 4567",
  "location": "New York, USA",
  "skills": ["React", "Node.js", "TypeScript", "MongoDB"],
  "years_experience": 10,
  "active": true,
  "featured": false
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Team member created successfully",
  "data": {
    "id": 4
  }
}
```

**Error Response** (400) - Invalid Skills:
```json
{
  "success": false,
  "error": "Invalid skills format. Skills must be an array of strings like [\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

### Update Team Member

**Endpoint**: `PUT /api/admin/team/{id}` or `PATCH /api/admin/team/{id}`

**Request Example**:
```json
{
  "phone": "+44 20 7946 0958",
  "location": "London, UK",
  "skills": ["Leadership", "Project Management", "Agile"]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Team member updated successfully"
}
```

**Error Response** (400) - Invalid Skills:
```json
{
  "success": false,
  "error": "Invalid skills format. Skills must be an array of strings like [\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

## Frontend Implementation

### Admin Form

When creating/editing a team member in the admin panel:

```javascript
// Correct way to set skills
const teamMember = {
  name: "Jane Smith",
  position: "CTO",
  phone: "+1 555 987 6543",
  location: "San Francisco, USA",
  skills: ["Leadership", "Architecture", "Cloud Computing"] // Array of strings
};

// API call
await apiRequest('/api/admin/team', {
  method: 'POST',
  body: JSON.stringify(teamMember)
});
```

### Handling Comma-Separated Input

If you have a text input for skills (comma-separated), convert it:

```javascript
// User input: "React, Node.js, TypeScript"
const skillsInput = "React, Node.js, TypeScript";

// Convert to array
const skillsArray = skillsInput
  .split(',')
  .map(s => s.trim())
  .filter(s => s.length > 0);

// Result: ["React", "Node.js", "TypeScript"]

const teamMember = {
  // ... other fields
  skills: skillsArray
};
```

## Database Storage

### How Data is Stored

After validation, skills are stored as JSON in the database:

```sql
-- Database value
'["Leadership", "Mentorship", "Strategy", "Software Development"]'
```

### Retrieving Data

When fetching team members, the API automatically parses JSON:

```javascript
// API Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "phone": "+1 555 123 4567",
      "location": "New York, USA",
      "skills": ["Leadership", "Mentorship", "Strategy"], // Already parsed
      // ... other fields
    }
  ]
}
```

## Backend Validation Functions

### TeamMemberController.php

```php
/**
 * Validate skills format
 * Skills must be an array of strings: ["Leadership", "Mentorship", "Strategy"]
 */
private function validateSkills($skills)
{
    if (empty($skills)) {
        return [];
    }

    if (is_string($skills)) {
        $skillsArray = array_map('trim', explode(',', $skills));
        $skillsArray = array_filter($skillsArray);
        return array_values($skillsArray);
    }

    if (is_array($skills)) {
        if (array_keys($skills) === range(0, count($skills) - 1)) {
            $skillsArray = array_map('trim', $skills);
            $skillsArray = array_filter($skillsArray);
            return array_values($skillsArray);
        }
    }

    throw new Exception('Invalid skills format. Skills must be an array of strings like ["Leadership", "Mentorship", "Strategy"]');
}
```

### TeamController.php

```php
/**
 * Similar validation with false return on error
 */
private function validateSkills($skills)
{
    // ... validation logic
    
    // Returns false on invalid format
    return false;
}
```

## Testing

### Valid Test Cases

1. **Array of skills**:
   ```json
   {"skills": ["React", "Node.js", "MongoDB"]}
   ```
   ✅ Should succeed

2. **Comma-separated string**:
   ```json
   {"skills": "React, Node.js, MongoDB"}
   ```
   ✅ Should succeed and convert to array

3. **Empty array**:
   ```json
   {"skills": []}
   ```
   ✅ Should succeed (saved as empty array)

4. **Null/undefined**:
   ```json
   {"skills": null}
   ```
   ✅ Should succeed (saved as empty array)

### Invalid Test Cases

1. **Associative array**:
   ```json
   {"skills": {"0": "React", "1": "Node.js"}}
   ```
   ❌ Should fail with error message

2. **Mixed types**:
   ```json
   {"skills": ["React", 123, true, null]}
   ```
   ❌ Should fail with error message

3. **Nested arrays**:
   ```json
   {"skills": [["React"], ["Node.js"]]}
   ```
   ❌ Should fail with error message

## Phone Number Best Practices

### Format Recommendations

1. **International Format**: Use `+` prefix with country code
   - Example: `+232 78 618435` (Sierra Leone)
   - Example: `+44 20 7946 0958` (UK)
   - Example: `+1 555 123 4567` (US)

2. **Spacing**: Use spaces for readability
   - ✅ `+1 555 123 4567`
   - ⚠️ `+15551234567` (valid but less readable)

3. **Country Code**: Always include country code for international clarity

### Display Format

On the public team page, phone numbers are displayed with a phone icon:

```jsx
{member.phone && (
  <div className="flex items-center text-sm text-gray-600">
    <Phone className="h-4 w-4 text-blue-600 mr-3" />
    <span>{member.phone}</span>
  </div>
)}
```

## Location Best Practices

### Format Recommendations

1. **City, Country**: Most common format
   - Example: `London, UK`
   - Example: `Freetown, Sierra Leone`
   - Example: `New York, USA`

2. **Country Only**: For executives or remote workers
   - Example: `Sierra Leone`
   - Example: `United Kingdom`

3. **With Emoji Flags** (Optional): For visual appeal
   - Example: `🇸🇱 Sierra Leone`
   - Example: `🇬🇧 London, UK`

### Display Format

On the public team page, locations are displayed with a location icon:

```jsx
{member.location && (
  <div className="flex items-center text-sm text-gray-600">
    <MapPin className="h-4 w-4 text-green-600 mr-3" />
    <span>{member.location}</span>
  </div>
)}
```

## Migration Guide

### Updating Existing Records

If you have existing team members without phone/location:

```sql
-- Add phone and location to existing member
UPDATE team_members 
SET 
  phone = '+232 78 618435',
  location = 'Sierra Leone'
WHERE id = 1;
```

### Bulk Update

```sql
-- Update multiple members
UPDATE team_members 
SET location = 'Sierra Leone'
WHERE department = 'Executive';
```

### Fixing Invalid Skills

```sql
-- Fix invalid skills format (if any exist)
UPDATE team_members 
SET skills = JSON_ARRAY('Leadership', 'Strategy')
WHERE id = 1;
```

## Error Handling

### Common Errors

1. **"Invalid skills format"**
   - **Cause**: Skills not in array format
   - **Solution**: Convert to `["skill1", "skill2"]` format

2. **"Name and position are required"**
   - **Cause**: Missing required fields
   - **Solution**: Provide both name and position

3. **"Team member not found"**
   - **Cause**: Invalid team member ID
   - **Solution**: Verify the ID exists

## Security Considerations

1. **Input Sanitization**: All inputs are sanitized before storage
2. **SQL Injection Prevention**: Prepared statements used
3. **XSS Protection**: Data escaped on output
4. **Phone Validation**: No validation currently, store as-is
5. **Skills Validation**: Strict array format enforced

## Conclusion

The enhanced team members system now supports:
- ✅ Phone number storage and display
- ✅ Location storage and display
- ✅ Strict skills validation (array format required)
- ✅ Automatic conversion of comma-separated skills
- ✅ Clear error messages for invalid data
- ✅ Backward compatibility with existing data

All team member operations (create/update) now validate skills format and properly save phone and location information.
