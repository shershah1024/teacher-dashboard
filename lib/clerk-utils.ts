import { clerkClient } from '@clerk/nextjs/server';

/**
 * Utility interface for user data with email
 */
export interface UserWithEmail {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
}

/**
 * Get a single user's email address by user ID
 * @param userId - The Clerk user ID
 * @returns User email address or null if not found
 */
export async function getUserEmailById(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Return the primary email address if available
    if (user.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress;
    }
    
    // Fallback to first email address if no primary is set
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0]?.emailAddress || null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching user email for ID ${userId}:`, error);
    return null;
  }
}

/**
 * Get user data including email by user ID
 * @param userId - The Clerk user ID
 * @returns User data with email or null if not found
 */
export async function getUserWithEmailById(userId: string): Promise<UserWithEmail | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Get primary email address
    let email: string | null = null;
    if (user.primaryEmailAddress?.emailAddress) {
      email = user.primaryEmailAddress.emailAddress;
    } else if (user.emailAddresses && user.emailAddresses.length > 0) {
      email = user.emailAddresses[0]?.emailAddress || null;
    }
    
    return {
      userId: user.id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
    };
  } catch (error) {
    console.error(`Error fetching user data for ID ${userId}:`, error);
    return null;
  }
}

/**
 * Get multiple users' email addresses by user IDs (batch operation)
 * Note: This uses individual API calls as Clerk doesn't have a batch getUsers method
 * For better performance with large datasets, consider using getUserList with filters
 * @param userIds - Array of Clerk user IDs
 * @returns Array of users with email data
 */
export async function getUsersWithEmailsByIds(userIds: string[]): Promise<UserWithEmail[]> {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    // Process users in batches to avoid overwhelming the API
    const batchSize = 10;
    const results: UserWithEmail[] = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(userId => getUserWithEmailById(userId));
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          console.warn(`Failed to fetch user data for ID ${batch[index]}`);
          // Add placeholder for failed requests
          results.push({
            userId: batch[index] || 'unknown',
            email: null,
            firstName: null,
            lastName: null,
            fullName: 'Unknown User'
          });
        }
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching multiple users with emails:', error);
    return [];
  }
}

/**
 * Get users by email addresses (useful for reverse lookup)
 * @param emailAddresses - Array of email addresses to search for
 * @param limit - Maximum number of users to return (default: 100)
 * @returns Array of users matching the email addresses
 */
export async function getUsersByEmailAddresses(
  emailAddresses: string[], 
  limit: number = 100
): Promise<UserWithEmail[]> {
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      emailAddress: emailAddresses,
      limit
    });
    
    return users.map(user => ({
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress || 
             (user.emailAddresses?.[0]?.emailAddress || null),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error fetching users by email addresses:', error);
    return [];
  }
}

/**
 * Search users by query (partial match on email, name, etc.)
 * @param query - Search query string
 * @param limit - Maximum number of users to return (default: 20)
 * @returns Array of users matching the query
 */
export async function searchUsers(query: string, limit: number = 20): Promise<UserWithEmail[]> {
  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      query,
      limit
    });
    
    return users.map(user => ({
      userId: user.id,
      email: user.primaryEmailAddress?.emailAddress || 
             (user.emailAddresses?.[0]?.emailAddress || null),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

/**
 * Validate if a user ID exists in Clerk
 * @param userId - The Clerk user ID to validate
 * @returns boolean indicating if user exists
 */
export async function validateUserId(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.getUser(userId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user count for organization users (if you need statistics)
 * @param emailDomain - Optional email domain filter (e.g., '@company.com')
 * @returns Total count of users
 */
export async function getUserCount(emailDomain?: string): Promise<number> {
  try {
    const client = await clerkClient();
    const { totalCount } = await client.users.getUserList({
      query: emailDomain,
      limit: 1 // We only need the count
    });
    
    return totalCount;
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
}