import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const sectionText = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel);

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for an empty batch', async () => {
    const response = await request(app).post('/api/webhooks').send({
      event: 'youtube_upload_batch',
      videos: [],
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for each uploaded video', async () => {
    const response = await request(app).post('/api/webhooks/youtube-upload-batch').send({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: {
            title: 'Medicion 5 Ohm con certificacion SEC y RIC N06',
          },
        },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://youtu.be/abc123');
    expect(response.text).toContain('2. Copy LinkedIn empresa:');
    expect(response.text).toContain('3. Caption Instagram:');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 aplica segun');
    expect(response.text).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(?:(?:ohmios?|ohms?|omega|omegas)\b|[\u03a9\u03c9\u2126])/i,
    );
    expect(response.text).not.toMatch(/\bcert(?:ificacion|ificado|\.?)\s+SEC\b/i);

    const linkedIn = sectionText(response.text, '2. Copy LinkedIn empresa:', '3. Caption Instagram:');
    const instagram = response.text.slice(response.text.indexOf('3. Caption Instagram:')).trim();

    expect(linkedIn.length).toBeLessThanOrEqual(900);
    expect(instagram.length).toBeLessThanOrEqual(500);
  });

  it('rejects unsupported events on the generic webhook route', async () => {
    const response = await request(app).post('/api/webhooks').send({
      event: 'other_event',
      videos: [{ url: 'https://youtu.be/abc123' }],
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe('UNSUPPORTED_EVENT');
  });
});
