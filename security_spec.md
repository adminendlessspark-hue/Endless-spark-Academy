# Security Specification - Endless Spark School

## Data Invariants
1. Students can only read and update their own profiles, invoices, leave requests, and projects.
2. Only Admins can create courses, modules, quiz questions, and holidays.
3. Staff (Faculty, Telecaller, Accounts, QC) have specific permissions based on their role.
4. Emails must be verified for all writes.
5. Document IDs must be valid and respect size limits.

## The "Dirty Dozen" Payloads (Deny List)
1. **Identity Spoofing**: Creating a user with `isApproved: true` as a non-admin.
2. **Role Escalation**: Updating own role from `student` to `admin`.
3. **Ghost Fields**: Adding `isVerified: true` to a user profile update.
4. **PII Leak**: Reading another user's private data (email) without staff role.
5. **Orphaned Writes**: Creating a `LeaveRequest` for a non-existent student ID.
6. **Value Poisoning**: Sending a 1MB string for a `name` field.
7. **Resource Poisoning**: Using a 2KB string as a document ID.
8. **Bypassing Verification**: Writing valid data but with `email_verified: false`.
9. **State Shortcutting**: Manually setting `invoice.status` to `paid` without admin/accounts role.
10. **Shadow Attendance**: Student marking themselves `present` for a future date.
11. **Locked Field Modification**: Changing `createdAt` timestamp.
12. **Blanket Query Scraping**: Attempting to list all users without specific filters or staff role.
