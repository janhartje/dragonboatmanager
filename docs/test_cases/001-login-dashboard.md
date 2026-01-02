# Test Case: Login & Dashboard Access

**ID**: TC-001
**Description**: Verify that a user can login via the test login page and access the dashboard.
**Pre-conditions**:
- Application is running locally.
- Test user credentials exist (test@drachenbootmanager.de / testuser123).

**Steps**:
1. Navigate to `/test-login`.
2. Click "Login as Test User".
3. Verify redirection to `/app`.
4. Verify dashboard elements (Greeting, "Create Team" button).

**Expected Result**:
- User is redirected to the dashboard.
- Welcome message is visible.
- "Create Team" option is available for new users.
