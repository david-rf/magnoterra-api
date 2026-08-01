import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const linkedInSection = (markdown) => (
  markdown.match(/2\) Copy LinkedIn empresa\n([\s\S]*?)\n\n3\) Caption Instagram/)?.[1] ?? ''
);

const instagramSection = (markdown) => (
  markdown.match(/3\) Caption Instagram\n([\s\S]*?)(?:\n\n---|$)/)?.[1] ?? ''
);

describe('YouTube upload batch webhook', () => {
  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Instalacion de malla de puesta a tierra para faena industrial',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: 'Medicion y continuidad para tablero principal',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/def456');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 se revisan de forma condicionada');
    expect(response.text).not.toMatch(/Omega|SEC|cert/i);

    const firstLinkedInCopy = linkedInSection(response.text);
    const firstInstagramCaption = instagramSection(response.text);

    expect(firstLinkedInCopy.length).toBeLessThanOrEqual(900);
    expect(firstInstagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns NO_VIDEOS when videos is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [],
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
