# Quick API Examples - Phone, Location & Skills

## Create Team Member with Phone & Location

### Request
```bash
POST http://localhost:8002/api/admin/team
Content-Type: application/json

{
  "name": "John Doe",
  "position": "Senior Developer",
  "department": "Technology",
  "bio": "Experienced full-stack developer",
  "email": "john@sabiteck.com",
  "phone": "+1 555 123 4567",
  "location": "New York, USA",
  "skills": ["React", "Node.js", "TypeScript", "MongoDB"],
  "years_experience": 8,
  "active": true,
  "featured": false
}
```

### Success Response
```json
{
  "success": true,
  "message": "Team member created successfully",
  "data": {
    "id": 4
  }
}
```

### Error Response (Invalid Skills)
```json
{
  "success": false,
  "error": "Invalid skills format. Skills must be an array of strings like [\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

---

## Update Team Member

### Request
```bash
PUT http://localhost:8002/api/admin/team/4
Content-Type: application/json

{
  "phone": "+44 20 7946 0958",
  "location": "London, UK",
  "skills": ["Leadership", "Architecture", "Cloud Computing"]
}
```

### Success Response
```json
{
  "success": true,
  "message": "Team member updated successfully"
}
```

---

## Valid Skills Formats

### Format 1: Array of Strings (Recommended)
```json
{
  "skills": ["Leadership", "Mentorship", "Strategy"]
}
```

### Format 2: Comma-Separated String (Auto-converted)
```json
{
  "skills": "Leadership, Mentorship, Strategy"
}
```

### Format 3: JSON String (Auto-parsed)
```json
{
  "skills": "[\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

---

## Invalid Skills Formats (Will Reject)

### ❌ Associative Array
```json
{
  "skills": {
    "0": "Leadership",
    "1": "Mentorship"
  }
}
```

### ❌ Mixed Types
```json
{
  "skills": ["Leadership", 123, null, true]
}
```

### ❌ Nested Arrays
```json
{
  "skills": [["Leadership"], ["Mentorship"]]
}
```

---

## Complete Example with All Fields

```bash
POST http://localhost:8002/api/admin/team
Content-Type: application/json

{
  "name": "Alpha Ousman Barrie",
  "position": "CEO & Founder",
  "department": "Executive",
  "bio": "Visionary leader driving innovation in education technology with 15+ years of experience.",
  "email": "alpha@sabiteck.com",
  "phone": "+232 78 618435",
  "location": "Sierra Leone",
  "photo_url": "/uploads/team/alpha.jpg",
  "linkedin_url": "https://linkedin.com/in/alpha-barrie",
  "twitter_url": "",
  "website_url": "https://sabiteck.com",
  "skills": [
    "Leadership",
    "Mentorship",
    "Strategy",
    "Software Development",
    "Business Development",
    "Digital Media",
    "Product Innovation",
    "Education"
  ],
  "years_experience": 15,
  "education": "Master of Business Administration",
  "active": true,
  "featured": true,
  "order_position": 1
}
```

---

## Testing with cURL

### Create
```bash
curl -X POST http://localhost:8002/api/admin/team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "position": "Developer",
    "phone": "+1 555 000 1111",
    "location": "Seattle, USA",
    "skills": ["React", "Node.js"]
  }'
```

### Update
```bash
curl -X PUT http://localhost:8002/api/admin/team/4 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+44 7911 123456",
    "location": "Manchester, UK"
  }'
```

### Get All
```bash
curl http://localhost:8002/api/team
```

---

## Database Query Examples

### Insert with Phone & Location
```sql
INSERT INTO team_members (
  name, slug, position, department, phone, location, skills
) VALUES (
  'John Doe',
  'john-doe',
  'Developer',
  'Technology',
  '+1 555 123 4567',
  'New York, USA',
  '["React", "Node.js", "TypeScript"]'
);
```

### Update Phone & Location
```sql
UPDATE team_members 
SET 
  phone = '+44 20 7946 0958',
  location = 'London, UK'
WHERE id = 1;
```

### Query with Phone & Location
```sql
SELECT 
  id, name, position, phone, location, skills
FROM team_members
WHERE active = 1
ORDER BY order_position ASC;
```

---

## JavaScript/React Example

```javascript
// Create team member
const createTeamMember = async () => {
  const teamMember = {
    name: "Sarah Johnson",
    position: "Product Manager",
    phone: "+44 20 7946 0958",
    location: "London, UK",
    skills: ["Leadership", "Product Management", "Agile"],
    years_experience: 10,
    active: true,
    featured: true
  };

  try {
    const response = await fetch('http://localhost:8002/api/admin/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamMember)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Success:', result);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Update team member
const updateTeamMember = async (id) => {
  const updates = {
    phone: "+1 555 987 6543",
    location: "San Francisco, USA",
    skills: ["Leadership", "Strategy", "Innovation"]
  };

  try {
    const response = await fetch(`http://localhost:8002/api/admin/team/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Updated:', result);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

---

## Validation Error Messages

### Invalid Skills Format
```json
{
  "success": false,
  "error": "Invalid skills format. Skills must be an array of strings like [\"Leadership\", \"Mentorship\", \"Strategy\"]"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "error": "Name and position are required"
}
```

### Team Member Not Found
```json
{
  "success": false,
  "error": "Team member not found"
}
```

---

## Tips

1. **Phone Numbers**: Use international format with country code (+XXX)
2. **Location**: Be consistent with format (City, Country or Country only)
3. **Skills**: Always use array format for best results
4. **Testing**: Use the test-team-phone-location-skills.html page
5. **Debugging**: Check browser console and backend logs for errors
