import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const extractSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const contentStart = start + startLabel.length;
  const end = endLabel ? markdown.indexOf(endLabel, contentStart) : markdown.length;

  return markdown.slice(contentStart, end).trim();
};

describe('YouTube Upload Batch Webhook', () => {
  it('returns NO_VIDEOS when payload is empty', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns NO_VIDEOS when videos array is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('rejects non-youtube upload batch events when videos are present', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'other_event',
        videos: [{ video_id: 'vid-1', url: 'https://youtu.be/example', job: 'obra industrial' }],
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('INVALID_EVENT');
  });

  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'vid-1',
            url: 'https://youtu.be/example-1',
            job: 'obra industrial con 5Ω y cert SEC',
          },
          {
            video_id: 'vid-2',
            url: 'https://youtu.be/example-2',
            job: 'mantencion planta norte',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example-1');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/example-2');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 se evalua segun las condiciones de cada proyecto');
    expect(response.text).not.toMatch(/Ω|ohm|SEC/i);
  });

  it('keeps LinkedIn and Instagram text within required limits', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'vid-1',
            url: 'https://youtu.be/example-1',
            job: 'proyecto de puesta a tierra para infraestructura critica con revision de terreno y continuidad operativa',
          },
        ],
      });

    const linkedIn = extractSection(
      response.text,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram',
    );
    const instagram = extractSection(response.text, '3) Caption Instagram');

    expect(linkedIn.length).toBeLessThanOrEqual(900);
    expect(instagram.length).toBeLessThanOrEqual(500);
  });
});
