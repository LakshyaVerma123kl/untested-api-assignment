const { validateCreateTask, validateUpdateTask, validateAssignTask } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateCreateTask', () => {
    it('should return error if title is missing', () => {
      expect(validateCreateTask({})).toContain('title is required');
    });

    it('should return error if title is not a string', () => {
      expect(validateCreateTask({ title: 123 })).toContain('title is required');
    });
    
    it('should return error if title is empty', () => {
      expect(validateCreateTask({ title: '   ' })).toContain('title is required');
    });

    it('should return error for invalid status', () => {
      expect(validateCreateTask({ title: 'T', status: 'invalid' })).toContain('status must be one of');
    });

    it('should return error for invalid priority', () => {
      expect(validateCreateTask({ title: 'T', priority: 'invalid' })).toContain('priority must be one of');
    });

    it('should return error for invalid dueDate', () => {
      expect(validateCreateTask({ title: 'T', dueDate: 'not-a-date' })).toContain('dueDate must be a valid ISO date');
    });

    it('should return null for valid payload', () => {
      expect(validateCreateTask({ title: 'T', status: 'done', priority: 'high', dueDate: '2023-01-01T00:00:00.000Z' })).toBeNull();
    });
  });

  describe('validateUpdateTask', () => {
    it('should return error if title is empty string', () => {
      expect(validateUpdateTask({ title: '   ' })).toContain('title must be a non-empty string');
    });

    it('should accept valid payload without title', () => {
      expect(validateUpdateTask({ status: 'in_progress' })).toBeNull();
    });
    
    it('should return null for valid full payload', () => {
      expect(validateUpdateTask({ title: 'New', status: 'in_progress' })).toBeNull();
    });
  });

  describe('validateAssignTask', () => {
    it('should return error if assignee is undefined', () => {
      expect(validateAssignTask({})).toContain('assignee is required');
    });

    it('should return error if assignee is empty string', () => {
      expect(validateAssignTask({ assignee: '   ' })).toContain('assignee must be a non-empty string');
    });

    it('should return error if assignee is restricted type', () => {
      expect(validateAssignTask({ assignee: 123 })).toContain('assignee must be a non-empty string');
    });

    it('should return null if assignee is valid string', () => {
      expect(validateAssignTask({ assignee: 'Bob' })).toBeNull();
    });

    it('should return null if assignee is explicitly null', () => {
      expect(validateAssignTask({ assignee: null })).toBeNull();
    });
  });
});
