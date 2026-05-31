# Security Specification for Habit Tracker app

## 1. Data Invariants

1. **User Ownership (Authentication & Isolation)**: A user's profile, habits, and chat history can only be read, modified, or listed by the authenticated owner of that account (`request.auth.uid == userId`).
2. **Strict Identity Field Validation**: When creating or updating a habit or chat message, the associated parent path variable must correspond exactly with the authenticated user ID.
3. **Immutable Timestamps**: The `createdAt` and `updatedAt` timestamps in user records and habit records must be validated using `request.time` (the server's verified timestamp) rather than blindly trusting client inputs.
4. **Data Shape Enforcements**:
   - Habit IDs must conform to valid alphanumeric character limits.
   - Frequency values must strictly belong to the allowed `["daily", "3x per week", "5x per week", "weekends"]` set.
   - String parameters must have tight bounds checked using `.size()` to guard against resource exhaustion attacks.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following operations must be blocked (`PERMISSION_DENIED`) by our Firestore rules to ensure safety:

1. **Unauthenticated Read**: Reading the habit collection without being signed in.
2. **Cross-User Snooping**: Authenticated User B attempts to read User A's private habits map.
3. **Profile Hijacking**: User B attempts to update User A's preferences name.
4. **Spoofed Ownership**: Creating a habit where the path states user `X` but payload contains malicious metadata claiming other values.
5. **Denial of Wallet ID Flood**: Attempting to create a habit doc with an extremely long 10KB string ID.
6. **Denial of Wallet Name Flood**: Injecting a habit with a 1MB raw string as the habit `name`.
7. **Invalid Frequency Inject**: Trying to create/update a habit with frequency `"every_seconds"`.
8. **Negative Missed Days**: Setting `missedDays` to negative values like `-10`.
9. **No-Timestamp Creation**: Creating a user record with a mock client-side timestamp that is in the future.
10. **Chat Spoofing**: Injecting entries into User A's chat history claiming they are from the strict mentor `'model'` role instead of User.
11. **Streak Manipulation**: Forging streak value updates arbitrary times.
12. **Ghost Field Mutation**: Writing unapproved custom flags to bypass limits on actions.
