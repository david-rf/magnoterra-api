import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Health Check Endpoint', () => {
  it('should return 200 OK for /health', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });

  it('should return valid timestamp format', async () => {
    const response = await request(app).get('/health');
    const timestamp = new Date(response.body.timestamp);
    
    expect(timestamp.getTime()).not.toBeNaN();
    expect(timestamp).toBeInstanceOf(Date);
  });

  it('should return valid uptime', async () => {
    const response = await request(app).get('/health');
    
    expect(response.body.uptime).toBeGreaterThan(0);
    expect(typeof response.body.uptime).toBe('number');
  });
});
