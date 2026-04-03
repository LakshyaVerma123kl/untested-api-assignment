const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API Routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by status', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('T1');
    });

    it('should paginate results', async () => {
      taskService.create({ title: 'T1' });
      taskService.create({ title: 'T2' });
      taskService.create({ title: 'T3' });

      const res = await request(app).get('/tasks?page=2&limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('T3');
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return statistics', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body.todo).toBe(1);
      expect(res.body.done).toBe(0);
      expect(res.body.overdue).toBe(0);
    });
  });

  describe('POST /tasks', () => {
    it('should create a task with valid payload', async () => {
      const payload = { title: 'New API Task', priority: 'high' };
      const res = await request(app).post('/tasks').send(payload);
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New API Task');
      expect(res.body.priority).toBe('high');
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 for empty title', async () => {
      const res = await request(app).post('/tasks').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('title is required');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app).post('/tasks').send({ title: 'T', status: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task', async () => {
      const task = taskService.create({ title: 'Old' });
      const res = await request(app).put(`/tasks/${task.id}`).send({ title: 'New', status: 'in_progress' });
      
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 for missing task', async () => {
      const res = await request(app).put('/tasks/invalid').send({ title: 'New' });
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid payload', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app).put(`/tasks/${task.id}`).send({ title: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      
      expect(res.status).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return 404 for missing task', async () => {
      const res = await request(app).delete('/tasks/invalid');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task complete', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should return 404 for missing task', async () => {
      const res = await request(app).patch('/tasks/invalid/complete');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a task', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Charlie' });
      
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Charlie');
    });

    it('should unassign a task when passing null', async () => {
      const task = taskService.create({ title: 'T' });
      taskService.assignTask(task.id, 'Dave');
      
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: null });
      
      expect(res.status).toBe(200);
      expect(res.body.assignee).toBeNull();
    });

    it('should return 400 for missing assignee', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app).patch(`/tasks/${task.id}/assign`).send({}); // empty body
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('assignee is required');
    });

    it('should return 400 for empty string assignee', async () => {
      const task = taskService.create({ title: 'T' });
      const res = await request(app).patch(`/tasks/${task.id}/assign`).send({ assignee: '   ' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('non-empty string');
    });

    it('should return 404 for missing task', async () => {
      const res = await request(app).patch('/tasks/invalid/assign').send({ assignee: 'E' });
      expect(res.status).toBe(404);
    });
  });
});
