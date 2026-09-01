import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('YouTube upload batch webhook endpoint', () => {
  it('returns markdown for a valid upload batch', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Puesta a tierra edificio corporativo',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://youtu.be/abc123');
    expect(response.text).toContain('magnoterra.cl/contacto');
  });

  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
