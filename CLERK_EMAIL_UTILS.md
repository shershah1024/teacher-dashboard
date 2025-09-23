# Clerk Email Utilities Documentation

This document explains how to use the Clerk utilities to get student email addresses from user IDs using the latest Clerk documentation (2025).

## Overview

The utilities in `/lib/clerk-utils.ts` provide comprehensive functions to interact with Clerk's Backend SDK to retrieve user email addresses and related information.

## Available Functions

### 1. `getUserEmailById(userId: string)`

Gets a single user's email address by user ID.

```typescript
import { getUserEmailById } from '@/lib/clerk-utils';

const email = await getUserEmailById('user_123');
console.log(email); // 'student@example.com' or null
```

### 2. `getUserWithEmailById(userId: string)`

Gets complete user data including email, name, and formatted full name.

```typescript
import { getUserWithEmailById } from '@/lib/clerk-utils';

const user = await getUserWithEmailById('user_123');
console.log(user);
// {
//   userId: 'user_123',
//   email: 'student@example.com',
//   firstName: 'John',
//   lastName: 'Doe',
//   fullName: 'John Doe'
// }
```

### 3. `getUsersWithEmailsByIds(userIds: string[])`

Batch operation to get multiple users' data. Processes in batches of 10 to avoid API rate limits.

```typescript
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

const userIds = ['user_123', 'user_456', 'user_789'];
const users = await getUsersWithEmailsByIds(userIds);
console.log(users);
// Array of UserWithEmail objects
```

### 4. `getUsersByEmailAddresses(emailAddresses: string[])`

Reverse lookup - find users by their email addresses.

```typescript
import { getUsersByEmailAddresses } from '@/lib/clerk-utils';

const emails = ['student1@example.com', 'student2@example.com'];
const users = await getUsersByEmailAddresses(emails);
```

### 5. `searchUsers(query: string)`

Search users by partial match on email, name, etc.

```typescript
import { searchUsers } from '@/lib/clerk-utils';

const users = await searchUsers('john');
// Returns users matching 'john' in name or email
```

## Usage in Dashboard APIs

### Example: Enhanced Reading Scores API

```typescript
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

export async function POST(request: NextRequest) {
  // ... fetch reading results from Supabase
  
  // Get unique user IDs
  const uniqueUserIds = [...new Set(readingResults?.map(result => result.user_id) || [])];
  
  // Get user details with emails from Clerk
  const usersWithEmails = await getUsersWithEmailsByIds(uniqueUserIds);
  
  // Create lookup map
  const userDetailsMap = Object.fromEntries(
    usersWithEmails.map(u => [u.userId, u])
  );
  
  // Enrich results with email data
  const enrichedResults = readingResults?.map(result => ({
    ...result,
    userName: userDetailsMap[result.user_id]?.fullName || `Student ${result.user_id.slice(5, 9)}`,
    userEmail: userDetailsMap[result.user_id]?.email,
    organization: userDetailsMap[result.user_id]?.organizationName || 'Unknown'
  }));
  
  return NextResponse.json({ results: enrichedResults });
}
```

## API Endpoints

### `/api/users/email-lookup` - Email Lookup Service

**POST Request Examples:**

1. **Get single user email:**
```json
{
  "action": "getEmailById",
  "userId": "user_123"
}
```

2. **Get user with complete data:**
```json
{
  "action": "getUserWithEmail",
  "userId": "user_123"
}
```

3. **Batch get multiple users:**
```json
{
  "action": "getBatchEmails",
  "userIds": ["user_123", "user_456", "user_789"]
}
```

4. **Find users by emails:**
```json
{
  "action": "getUsersByEmails",
  "emailAddresses": ["student1@example.com", "student2@example.com"]
}
```

5. **Search users:**
```json
{
  "action": "searchUsers",
  "query": "john"
}
```

**GET Request:**
```
GET /api/users/email-lookup?userId=user_123
```

### `/api/teacher-dashboard/users-with-emails` - Organization Users with Emails

**POST Request:**
```json
{
  "organizationCode": "ANB",
  "includeEmails": true
}
```

**GET Request:**
```
GET /api/teacher-dashboard/users-with-emails?organizationCode=ANB&limit=50
```

## Error Handling

All functions include comprehensive error handling:

- Returns `null` for single user lookups when user not found
- Returns empty arrays for batch operations when no users found
- Logs errors to console for debugging
- Gracefully handles API rate limits with batching

## Performance Considerations

1. **Batching**: The `getUsersWithEmailsByIds` function processes users in batches of 10 to avoid overwhelming Clerk's API
2. **Caching**: Consider implementing caching for frequently accessed user data
3. **Rate Limits**: Clerk has API rate limits - the utilities handle this with batch processing and error handling

## Integration Examples

### In Dashboard Components

```typescript
// In a React component
const [usersWithEmails, setUsersWithEmails] = useState([]);

useEffect(() => {
  const fetchUsersWithEmails = async () => {
    const response = await fetch('/api/teacher-dashboard/users-with-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationCode: 'ANB' })
    });
    const data = await response.json();
    setUsersWithEmails(data.users);
  };
  
  fetchUsersWithEmails();
}, []);
```

### Email Export Functionality

```typescript
// Export users with emails to CSV
import { getUsersWithEmailsByIds } from '@/lib/clerk-utils';

export async function exportUsersToCSV(organizationCode: string) {
  // Get user IDs from Supabase
  const { data: orgUsers } = await supabase
    .from('user_organizations')
    .select('user_id')
    .eq('organization_code', organizationCode);
    
  // Get emails from Clerk
  const userIds = orgUsers?.map(u => u.user_id) || [];
  const usersWithEmails = await getUsersWithEmailsByIds(userIds);
  
  // Create CSV content
  const csvContent = usersWithEmails.map(user => 
    `${user.fullName},${user.email || 'No email'},${user.userId}`
  ).join('\n');
  
  return `Name,Email,User ID\n${csvContent}`;
}
```

## Environment Requirements

Make sure you have the following environment variables set:

```env
CLERK_SECRET_KEY=your_clerk_secret_key
```

The utilities use the latest Clerk Next.js SDK and are compatible with:
- Next.js 15+ (App Router)
- Clerk SDK version 5+
- Node.js 18+

## Security Notes

- All operations are server-side only (using Backend SDK)
- User data is fetched securely using Clerk's authenticated API
- No sensitive data is exposed to client-side
- Proper error handling prevents data leaks