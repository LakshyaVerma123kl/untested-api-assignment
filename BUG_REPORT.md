# Bug Report

I found 4 bugs in the `task-api` application during code review and test creation.

## 1. Pagination Off-by-one 🔴 High
**Location:** `src/services/taskService.js` (line 12 in original file)
**Found via:** Code review of pagination math.

- **Expected Behavior:** `GET /tasks?page=1&limit=10` should return the first 10 items (indexes 0 to 9).
- **Actual Behavior:** The `offset` calculation was `page * limit`, meaning `1 * 10 = 10`. The results start at index 10, completely skipping the first 10 items on page 1.
- **Fix:** Update logic to `const offset = (page - 1) * limit;`

## 2. Invalid Protected Fields Overwrite 🟠 Medium
**Location:** `src/services/taskService.js` (line 50 in original file)
**Found via:** Code review of the `update()` function's object spread operator.

- **Expected Behavior:** Users should only be able to update mutable fields (`title`, `status`, `description` etc). Protected fields like `id` and `createdAt` should remain untouched.
- **Actual Behavior:** The update method does `const updated = { ...tasks[index], ...fields };`. This allows a malicious payload like `{"id": "hacked"}` to overwrite the system-generated ID, permanently breaking the data integrity.
- **Fix:** Destructure out protected fields before merging: `const { id: _id, createdAt: _createdAt, ...safeFields } = fields;` then merge `safeFields`.

## 3. Status Filter Uses Substring Math 🟡 Medium
**Location:** `src/services/taskService.js` (line 9 in original file)
**Found via:** Code review of array `.filter()` logic.

- **Expected Behavior:** `GET /tasks?status=todo` should return exactly tasks that are `todo`.
- **Actual Behavior:** The code used `.includes()`: `t.status.includes(status)`. A query for `status=do` would return both `todo` and `done`. A query for `status=in` would return `in_progress`.
- **Fix:** Force strict equality: `t.status === status;`

## 4. completeTask() Resets Priority 🟡 Medium
**Location:** `src/services/taskService.js` (line 69 in original file)
**Found via:** Code review for the `/tasks/:id/complete` handler logic.

- **Expected Behavior:** Marking a task as complete should only change its `status` to `done` and set `completedAt`. Its original priority (e.g., `high`) should remain intact for historical purposes. 
- **Actual Behavior:** The `completeTask` function hardcoded `priority: 'medium'` into the updated object spread, erasing whatever the prior state had.
- **Fix:** Remove the line `priority: 'medium'` from the `updated` object definition.
