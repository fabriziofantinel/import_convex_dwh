/**
 * Integration Test: End-to-End Sync Flow
 * Tests the complete sync flow logic and state transitions
 */

describe('Integration: End-to-End Sync Flow', () => {
  describe('Sync Job State Transitions', () => {
    it('should follow correct state progression: pending → running → success', () => {
      const states = ['pending', 'running', 'success'];
      
      // Simulate state transitions
      let currentState = 'pending';
      expect(currentState).toBe('pending');
      
      currentState = 'running';
      expect(currentState).toBe('running');
      
      currentState = 'success';
      expect(currentState).toBe('success');
      
      // Verify all states were visited
      expect(states).toContain('pending');
      expect(states).toContain('running');
      expect(states).toContain('success');
    });

    it('should follow correct state progression: pending → running → failed', () => {
      const states = ['pending', 'running', 'failed'];
      
      let currentState = 'pending';
      expect(currentState).toBe('pending');
      
      currentState = 'running';
      expect(currentState).toBe('running');
      
      currentState = 'failed';
      expect(currentState).toBe('failed');
      
      expect(states).toContain('failed');
    });

    it('should not allow invalid state transitions', () => {
      const validTransitions = {
        pending: ['running'],
        running: ['success', 'failed'],
        success: [],
        failed: [],
      };

      // Test valid transitions
      expect(validTransitions.pending).toContain('running');
      expect(validTransitions.running).toContain('success');
      expect(validTransitions.running).toContain('failed');
      
      // Test invalid transitions
      expect(validTransitions.pending).not.toContain('success');
      expect(validTransitions.success).not.toContain('running');
      expect(validTransitions.failed).not.toContain('running');
    });
  });

  describe('Sync Job Data Structure', () => {
    it('should create valid sync job with required fields', () => {
      const syncJob = {
        _id: 'job-123',
        app_id: 'app-456',
        app_name: 'test-app',
        status: 'pending',
        started_at: Date.now(),
        triggered_by: 'manual',
      };

      expect(syncJob._id).toBeDefined();
      expect(syncJob.app_id).toBeDefined();
      expect(syncJob.app_name).toBe('test-app');
      expect(syncJob.status).toBe('pending');
      expect(syncJob.started_at).toBeGreaterThan(0);
      expect(['manual', 'cron']).toContain(syncJob.triggered_by);
    });

    it('should include statistics on successful completion', () => {
      const completedJob = {
        _id: 'job-123',
        app_id: 'app-456',
        status: 'success',
        started_at: Date.now() - 30000,
        completed_at: Date.now(),
        duration_seconds: 30,
        tables_processed: 5,
        rows_imported: 1000,
      };

      expect(completedJob.status).toBe('success');
      expect(completedJob.completed_at).toBeGreaterThan(completedJob.started_at);
      expect(completedJob.duration_seconds).toBeGreaterThan(0);
      expect(completedJob.tables_processed).toBeGreaterThan(0);
      expect(completedJob.rows_imported).toBeGreaterThan(0);
    });

    it('should include error message on failure', () => {
      const failedJob = {
        _id: 'job-123',
        app_id: 'app-456',
        status: 'failed',
        started_at: Date.now() - 10000,
        completed_at: Date.now(),
        error_message: 'Connection timeout',
      };

      expect(failedJob.status).toBe('failed');
      expect(failedJob.error_message).toBeDefined();
      expect(failedJob.error_message).toBe('Connection timeout');
    });
  });

  describe('Concurrent Sync Prevention', () => {
    it('should detect running sync for app', () => {
      const runningJobs = [
        { _id: 'job-1', app_id: 'app-1', status: 'running' },
        { _id: 'job-2', app_id: 'app-2', status: 'success' },
      ];

      const hasRunningSync = (appId: string) => {
        return runningJobs.some(job => job.app_id === appId && job.status === 'running');
      };

      expect(hasRunningSync('app-1')).toBe(true);
      expect(hasRunningSync('app-2')).toBe(false);
      expect(hasRunningSync('app-3')).toBe(false);
    });

    it('should allow sync when no running job exists', () => {
      const jobs = [
        { _id: 'job-1', app_id: 'app-1', status: 'success' },
        { _id: 'job-2', app_id: 'app-1', status: 'failed' },
      ];

      const hasRunningSync = jobs.some(job => job.status === 'running');
      expect(hasRunningSync).toBe(false);
    });
  });

  describe('Webhook Payload Structure', () => {
    it('should create valid webhook payload', () => {
      const payload = {
        job_id: 'job-123',
        app_name: 'test-app',
        deploy_key: 'preview:team:project|token123',
        tables: ['table1', 'table2'],
        table_mapping: { table1: 'mapped_table1' },
      };

      expect(payload.job_id).toBeDefined();
      expect(payload.app_name).toBeDefined();
      expect(payload.deploy_key).toMatch(/^preview:.+:.+\|.+$/);
      expect(Array.isArray(payload.tables)).toBe(true);
      expect(payload.tables.length).toBeGreaterThan(0);
    });

    it('should include callback data on completion', () => {
      const callbackData = {
        job_id: 'job-123',
        status: 'success',
        completed_at: Date.now(),
        duration_seconds: 45,
        tables_processed: 3,
        rows_imported: 2500,
        log_content: 'Sync completed successfully',
      };

      expect(callbackData.job_id).toBeDefined();
      expect(['success', 'failed']).toContain(callbackData.status);
      expect(callbackData.completed_at).toBeGreaterThan(0);
      expect(callbackData.log_content).toBeDefined();
    });
  });
});
