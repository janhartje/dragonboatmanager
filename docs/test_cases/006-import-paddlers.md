# Test Case: Import Paddlers via CSV

**ID**: TC-006
**Description**: Verify that paddlers can be imported in bulk using the sample CSV file provided in the repository.
**Pre-conditions**:
- User is logged in as Admin/Captain.
- The sample file `docs/test_cases/test-kader.csv` is available.
- CSV Headers: `Name,Weight,Skill,Email`

**Steps**:
1. Navigate to the Team Dashboard.
2. Click the "Importieren" button (available for Captains).
3. Select the file from the repository at `docs/test_cases/test-kader.csv`.
4. Verify the preview modal displays the correct number of paddlers (40 rows in the sample file).
5. Click the "Importieren" confirmation button.
6. Verify that the paddlers are correctly added to the "Kader" (roster) with their attributes (Weight, Skill).

**Expected Result**:
- The import modal opens automatically upon file selection/processing.
- Data is correctly parsed: "Weight" maps to the weight field, "Skill" (e.g., drum, steer, left, right) maps to paddler skills.
- All 40 paddlers from the CSV are added to the team list.
- Roster count updates correctly.
