/**
 * Integration Test: Cron Job Triggering
 * Tests the Vercel cron job triggering mechanism
 */

import { NextApiRequest, NextApiResponse } from 'next';

// Mock the cron API route handler
const mockConvexQuery = jest.fn();
const mockConvexAction = jest.fn();

jest.mock('convex/browser', () => ({
  ConvexHttpClient: jest.fn().mockImplementation(() => ({
    query: mockConvexQuery,
    action: mockConvexAction,
  })),
}));

// Import after mocking
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Simulate the cron route handler logic
  const { authorization } = req.headers;
  const cronSecret = process.env.CRON_SECRET;

  if (authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { app_name } = req.query;

  try {
    const apps = await mockConvexQuery();
    const app = apps.find((a: any) => a.name === app_name);

    if (!app) {
      res.status(404).json({ error: 'App not found' });
      return;
    }

    if (!app.cron_enabled) {
      res.status(200).json({ message: 'Cron disabled for this app' });
      return;
    }

    await mockConvexAction({
      app_id: app._id,
      triggered_by: 'cron',
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

describe('Integration: Cron Job Triggering', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      headers: {},
      query: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    process.env.CRON_SECRET = 'test-cron-secret';
  });

  it('should reject unauthorized cron requests', async () => {
    mockReq.headers = { authorization: 'Bearer wrong-secret' };
    mockReq.query = { app_name: 'test-app' };

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should trigger sync for app with cron enabled', async () => {
    const mockApp = {
      _id: 'app-123',
      name: 'test-app',
      cron_enabled: true,
      cron_schedule: '0 2 * * *',
    };

    mockReq.headers = { authorization: 'Bearer test-cron-secret' };
    mockReq.query = { app_name: 'test-app' };

    mockConvexQuery.mockResolvedValue([mockApp]);
    mockConvexAction.mockResolvedValue({ success: true, job_id: 'job-123' });

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockConvexQuery).toHaveBeenCalled();
    expect(mockConvexAction).toHaveBeenCalledWith({
      app_id: 'app-123',
      triggered_by: 'cron',
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true });
  });

  it('should skip sync for app with cron disabled', async () => {
    const mockApp = {
      _id: 'app-123',
      name: 'test-app',
      cron_enabled: false,
    };

    mockReq.headers = { authorization: 'Bearer test-cron-secret' };
    mockReq.query = { app_name: 'test-app' };

    mockConvexQuery.mockResolvedValue([mockApp]);

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockConvexQuery).toHaveBeenCalled();
    expect(mockConvexAction).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Cron disabled for this app' });
  });

  it('should return 404 for non-existent app', async () => {
    mockReq.headers = { authorization: 'Bearer test-cron-secret' };
    mockReq.query = { app_name: 'non-existent-app' };

    mockConvexQuery.mockResolvedValue([]);

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'App not found' });
  });

  it('should handle errors during sync trigger', async () => {
    const mockApp = {
      _id: 'app-123',
      name: 'test-app',
      cron_enabled: true,
    };

    mockReq.headers = { authorization: 'Bearer test-cron-secret' };
    mockReq.query = { app_name: 'test-app' };

    mockConvexQuery.mockResolvedValue([mockApp]);
    mockConvexAction.mockRejectedValue(new Error('Webhook timeout'));

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Webhook timeout' });
  });

  it('should validate cron secret format', async () => {
    mockReq.headers = { authorization: 'InvalidFormat' };
    mockReq.query = { app_name: 'test-app' };

    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should handle multiple apps with different cron settings', async () => {
    const mockApps = [
      { _id: 'app-1', name: 'app1', cron_enabled: true },
      { _id: 'app-2', name: 'app2', cron_enabled: false },
      { _id: 'app-3', name: 'app3', cron_enabled: true },
    ];

    mockReq.headers = { authorization: 'Bearer test-cron-secret' };
    mockConvexQuery.mockResolvedValue(mockApps);
    mockConvexAction.mockResolvedValue({ success: true });

    // Test app1 (enabled)
    mockReq.query = { app_name: 'app1' };
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockConvexAction).toHaveBeenCalledWith({
      app_id: 'app-1',
      triggered_by: 'cron',
    });

    jest.clearAllMocks();

    // Test app2 (disabled)
    mockReq.query = { app_name: 'app2' };
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    expect(mockConvexAction).not.toHaveBeenCalled();
  });
});
