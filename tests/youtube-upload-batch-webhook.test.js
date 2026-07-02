import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const sectionBetween = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel);

  return markdown.slice(start + startLabel.length, end).trim();
};

const sectionAfter = (markdown, startLabel) => {
  const start = markdown.indexOf(startLabel);

  return markdown.slice(start + startLabel.length).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns NO_VIDEOS for an empty video batch', async () => {
    const response = await request(app).post('/api/webhooks').send({
      event: 'youtube_upload_batch',
      videos: [],
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for every uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: {
              title: 'Medicion 5 Ohm con certificacion SEC y RIC N06',
            },
          },
          {
            video_id: 'def456',
            job: 'Instalacion de malla para proyecto industrial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain(
      '1) URL\nhttps://www.youtube.com/watch?v=def456'
    );
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 condicionado');
    expect(response.text).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(?:(?:ohmios?|ohms?|omega|omegas)\b|[\u03a9\u03c9\u2126])/i
    );
    expect(response.text).not.toMatch(
      /\bcert(?:ificacion|ificado|\.?)\s+SEC\b/i
    );

    const firstVideo = response.text.split('\n\n---\n\n')[0];
    const linkedInCopy = sectionBetween(
      firstVideo,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = sectionAfter(
      firstVideo,
      '3) Caption Instagram'
    );

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('rejects unsupported events on the generic webhook route', async () => {
    const response = await request(app).post('/api/webhooks').send({
      event: 'other_event',
      videos: [{ url: 'https://youtu.be/abc123' }],
    });

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('UNSUPPORTED_EVENT');
  });
});
