# Submission Notes

Here is a summary of my logic and thought process for this take-home task.

## What I'd test next if I had more time

If I had more time, I would expand testing into these vectors:

- **Volume Testing**: `taskService.js` holds state entirely in-memory (`let tasks = []`). This means it scales poorly with thousands of inputs. I'd add tests inserting 10,000+ entries to observe memory usage and verify that `.findIndex()` execution time doesn't begin bottlenecking API requests.
- **Concurrent Request Scenarios**: JavaScript is single-threaded, but node asynchronous context switching could potentially lead to weird data mutations if multiple update requests hit the exact same ID sequentially in a real database setup. It's less an issue for in-memory synchronous pushes, but a real-world test suite should simulate a flurry of concurrent requests on the same UUID entity.
- **Data Integrity Tests**: A test ensuring an object doesn't mutate unexpectedly. Right now `taskService` returns object *references* (`getAll = () => [...tasks]` does a shallow copy, but tasks inside are still memory references). If a consumer module mutates the output of `findById(id)`, it pollutes the whole DB. I'd add tests explicitly freezing objects or deep-cloning them to prevent internal leaks.

## What surprised me

The biggest surprise was the vulnerability in the object-spread update pattern: `const updated = { ...tasks[index], ...fields };`. While common for React state updates, applying it unfiltered on back-end API payload parameters means consumers can overwrite read-only server metadata like `id` and `createdAt`. This is essentially "Mass Assignment Vulnerability" (CWE-915) out of the box in a simple helper function. 

## Questions I'd ask before shipping this to production

1. **What is going to replace the in-memory array?** State will reset every time node reboots. Should we throw this into Redis? Postgres? SQLite?
2. **What level of data normalization do we need for assignee?** My implementation just adds an `assignee: "Name"` string onto the task json blob. If we need to filter tasks *by assignee* long term, or want an `assigneeId` linking to a real Users table, doing it via open string fields is a bad foundation. 
3. **Paginating by Offset limits?** `getPaginated` does `.slice(offset)`. With large databases, `LIMIT / OFFSET` is considered an anti-pattern as it gets extremely computationally slow on deep pages. Should we migrate to cursor-based pagination?

---

## Code Coverage Results
As requested in the assignment details:

```text
 PASS  tests/validators.test.js
 PASS  tests/api.test.js
 PASS  tests/taskService.test.js

-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |   95.56 |    89.77 |   93.33 |   95.13 |                   
 src             |   69.23 |       75 |       0 |   69.23 |                   
  app.js         |   69.23 |       75 |       0 |   69.23 | 10-11,17-18       
 src/routes      |     100 |    91.66 |     100 |     100 |                   
  tasks.js       |     100 |    91.66 |     100 |     100 | 20-21             
 src/services    |     100 |    94.73 |     100 |     100 |                   
  taskService.js |     100 |    94.73 |     100 |     100 | 22                
 src/utils       |   89.65 |     87.8 |     100 |   89.65 |                   
  validators.js  |   89.65 |     87.8 |     100 |   89.65 | 25,28,31          
-----------------|---------|----------|---------|---------|-------------------

Test Suites: 3 passed, 3 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        3.702 s
```
