const taskService = require('../src/services/taskService');

describe('Task Service', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create()', () => {
    it('should create a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.assignee).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeDefined();
      expect(task.id).toBeDefined();
    });

    it('should create a task with provided values', () => {
      const payload = {
        title: 'Full Task',
        description: 'Details',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2023-12-31T00:00:00.000Z',
      };
      const task = taskService.create(payload);
      expect(task).toMatchObject(payload);
    });
  });

  describe('getAll()', () => {
    it('should return empty array initially', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    it('should return all created tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('findById()', () => {
    it('should return undefined for non-existent id', () => {
      expect(taskService.findById('invalid-id')).toBeUndefined();
    });

    it('should return the correct task', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('getByStatus()', () => {
    it('should match status exactly (Bug 2 Fix)', () => {
      taskService.create({ title: 'Done Task', status: 'done' });
      taskService.create({ title: 'Todo Task', status: 'todo' });
      
      const doneTasks = taskService.getByStatus('do'); // Should not match 'done' or 'todo'
      expect(doneTasks).toHaveLength(0);

      const exactDone = taskService.getByStatus('done');
      expect(exactDone).toHaveLength(1);
      expect(exactDone[0].title).toBe('Done Task');
    });
  });

  describe('getPaginated()', () => {
    it('should return correct page of results (Bug 1 Fix)', () => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }

      const page1 = taskService.getPaginated(1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');

      const page2 = taskService.getPaginated(2, 2);
      expect(page2).toHaveLength(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');
      
      const page3 = taskService.getPaginated(3, 2);
      expect(page3).toHaveLength(1);
      expect(page3[0].title).toBe('Task 5');
    });
  });

  describe('getStats()', () => {
    it('should calculate correct stats', () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'todo' });
      taskService.create({ title: 'T3', status: 'in_progress' });
      taskService.create({ title: 'T4', status: 'done' });

      // Overdue task (past date, not done)
      taskService.create({ 
        title: 'T5', 
        status: 'todo', 
        dueDate: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      });

      // Not overdue task (past date, but done)
      taskService.create({ 
        title: 'T6', 
        status: 'done', 
        dueDate: new Date(Date.now() - 86400000).toISOString() 
      });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(3); // T1, T2, T5
      expect(stats.in_progress).toBe(1); // T3
      expect(stats.done).toBe(2); // T4, T6
      expect(stats.overdue).toBe(1); // T5
    });
  });

  describe('update()', () => {
    it('should return null for non-existent id', () => {
      expect(taskService.update('invalid-id', { title: 'New' })).toBeNull();
    });

    it('should update allowed fields', () => {
      const task = taskService.create({ title: 'Old Title' });
      const updated = taskService.update(task.id, { title: 'New Title', status: 'in_progress' });
      
      expect(updated.title).toBe('New Title');
      expect(updated.status).toBe('in_progress');
      expect(taskService.findById(task.id).title).toBe('New Title');
    });

    it('should not overwrite protected fields like id and createdAt (Bug 4 Fix)', () => {
      const task = taskService.create({ title: 'Protected' });
      const originalId = task.id;
      const originalCreatedAt = task.createdAt;

      const updated = taskService.update(task.id, { 
        id: 'hacked-id', 
        title: 'Exploit',
        createdAt: '2000-01-01T00:00:00.000Z'
      });

      expect(updated.id).toBe(originalId);
      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.title).toBe('Exploit'); // Other fields should still update
    });
  });

  describe('remove()', () => {
    it('should return false for non-existent id', () => {
      expect(taskService.remove('invalid-id')).toBe(false);
    });

    it('should remove the task', () => {
      const task = taskService.create({ title: 'To Delete' });
      const result = taskService.remove(task.id);
      
      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
      expect(taskService.getAll()).toHaveLength(0);
    });
  });

  describe('completeTask()', () => {
    it('should return null for non-existent id', () => {
      expect(taskService.completeTask('invalid-id')).toBeNull();
    });

    it('should set status to done and completedAt', () => {
      const task = taskService.create({ title: 'To Complete' });
      const completed = taskService.completeTask(task.id);
      
      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
    });

    it('should not reset priority (Bug 3 Fix)', () => {
      const task = taskService.create({ title: 'High Priority', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      
      expect(completed.priority).toBe('high');
    });
  });

  describe('assignTask()', () => {
    it('should return null for non-existent id', () => {
      expect(taskService.assignTask('invalid-id', 'John')).toBeNull();
    });

    it('should assign a task to a user', () => {
      const task = taskService.create({ title: 'Unassigned Task' });
      const assigned = taskService.assignTask(task.id, 'Alice');
      
      expect(assigned.assignee).toBe('Alice');
      expect(taskService.findById(task.id).assignee).toBe('Alice');
    });

    it('should allow unassigning a task by passing null', () => {
      const task = taskService.create({ title: 'Task' });
      taskService.assignTask(task.id, 'Bob');
      const unassigned = taskService.assignTask(task.id, null);
      
      expect(unassigned.assignee).toBeNull();
    });
  });
});
