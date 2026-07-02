import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);
  return app;
};

describe('Webhook routes', () => {
  it('returns markdown for youtube_upload_batch payloads', async () => {
    const response = await request(createApp())
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://youtu.be/example-1',
            job: 'Proyecto industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example-1');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });

  it('returns NO_VIDEOS for empty payloads', async () => {
    const response = await request(createApp())
      .post('/api/webhooks')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('rejects unsupported webhook events as markdown text', async () => {
    const response = await request(createApp())
      .post('/api/webhooks')
      .send({ event: 'other_event', videos: [{ url: 'https://youtu.be/example-1' }] });

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('UNSUPPORTED_EVENT');
  });
});
