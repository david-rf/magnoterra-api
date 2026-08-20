import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const extractSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = endLabel ? markdown.indexOf(endLabel, start) : markdown.length;

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload has no videos', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown social copy for each video', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'yt-001',
            url: 'https://youtu.be/example',
            job: 'mantencion de malla de puesta a tierra industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');

    const linkedInCopy = extractSection(
      response.text,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram',
    );
    const instagramCaption = extractSection(response.text, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 debe evaluarse segun');
    expect(response.text).not.toMatch(/omega|ohm|Ω|SEC/i);
  });
});
