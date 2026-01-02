---
description: Standard procedure for testing the application, including test case documentation and bug reporting.
---

# Testing Workflow

This workflow defines how to test the application, document test cases, and report issues.

## 1. Testing Strategy
We primarily use **Exploratory Testing** combined with structured test cases.
- **Tool**: Use the Agent's Browser Tool to navigate and interact with the application.
- **Scope**: Focus on user flows, UI responsiveness, and data integrity.
- **Test User**: Use the configured test user (if available) or create a new user for testing purposes.

## 2. Documentation of Test Cases
All test cases must be documented in the `docs/test_cases/` directory.

### Naming Convention
- Files should be named with a 3-digit number followed by a descriptive slug, e.g., `010-profile-update.md`.
- CSV files for data import tests should be in the same directory.

### Format
Use the following Markdown format for new test cases:

```markdown
# Test Case: [Title]

**ID**: TC-[Number]
**Description**: [Brief description of what is being tested]
**Pre-conditions**:
- [Condition 1]
- [Condition 2]

**Steps**:
1. [Step 1]
2. [Step 2]
...

**Expected Result**:
- [Result 1]
- [Result 2]
```

## 3. Bug Reporting
If a bug is found during testing:

1.  **Create a GitHub Issue**.
2.  **Title**: Concise description of the error.
3.  **Labels**: Add `bug` and `automatisch erfasst`.
4.  **Body**:
    - Reference the Test Case ID (e.g., "Found during execution of TC-006").
    - Describe the observed behavior vs. the expected behavior.
    - Include steps to reproduce (or refer to the test case steps).

## 4. Execution
When asked to test a feature:
1.  Check if a test case exists in `docs/test_cases/`.
2.  If yes, execute the steps.
3.  If no, create a new test case file first, then execute it.
4.  Report any failures immediately as GitHub Issues.
