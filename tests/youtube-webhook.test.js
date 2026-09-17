import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('YouTube upload batch webhook', () => {
  it('responds NO_VIDEOS when the payload has no videos', async () => {
    const response = await request(buildTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('responds with markdown copy for each video', async () => {
    const response = await request(buildTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://www.youtube.com/watch?v=yt-001',
            job: 'Video de mantencion',
          },
          {
            video_id: 'yt-002',
            url: 'https://youtu.be/yt-002',
            job: 'Video de inspeccion',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://www.youtube.com/watch?v=yt-001');
    expect(response.text).toContain('1. URL: https://youtu.be/yt-002');
    expect(response.text.match(/2\. Copy LinkedIn empresa:/g)).toHaveLength(2);
    expect(response.text.match(/3\. Caption Instagram:/g)).toHaveLength(2);
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('rejects non youtube_upload_batch payloads with videos', async () => {
    const response = await request(buildTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'other_event',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://www.youtube.com/watch?v=yt-001',
            job: 'Video de mantencion',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Validation Error');
  });
});

