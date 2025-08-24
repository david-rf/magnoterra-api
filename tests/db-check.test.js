import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// Mock the database pool
vi.mock('../src/db/pool.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('Database Check Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return database status when connection is successful', async () => {
    const mockDbPool = await import('../src/db/pool.js');
    mockDbPool.default.query.mockResolvedValue([{ ok: 1 }]);

    const response = await request(app).get('/db-check');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ ok: 1 }]);
    expect(mockDbPool.default.query).toHaveBeenCalledWith('SELECT 1 as ok');
  });

  it('should return 500 when database connection fails', async () => {
    const mockDbPool = await import('../src/db/pool.js');
    const errorMessage = 'Connection refused';
    mockDbPool.default.query.mockRejectedValue(new Error(errorMessage));

    const response = await request(app).get('/db-check');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Database connection failed');
    expect(response.body).toHaveProperty('message', errorMessage);
  });

  it('should handle database query errors gracefully', async () => {
    const mockDbPool = await import('../src/db/pool.js');
    const errorMessage = 'Table does not exist';
    mockDbPool.default.query.mockRejectedValue(new Error(errorMessage));

    const response = await request(app).get('/db-check');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Database connection failed');
  });
});
