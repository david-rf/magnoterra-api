import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const extractSection = (text, startMarker, endMarker) => (
  text.split(startMarker)[1].split(endMarker)[0].trim()
);

describe('YouTube upload batch webhook', () => {
  it('returns markdown social copy for each video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Mantencion sistema puesta a tierra RIC N06 con medicion 5 Ohm y cert SEC',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('https://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06 segun lo que corresponda al proyecto');
    expect(response.text).not.toMatch(/\bSEC\b|ohm|omega|\u03a9/i);

    const linkedInCopy = extractSection(
      response.text,
      '2) Copy LinkedIn empresa\n',
      '\n\n3) Caption Instagram',
    );
    const instagramCaption = response.text.split('3) Caption Instagram\n')[1].trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('supports the descriptive YouTube upload batch route alias', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [],
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('rejects other non-empty webhook events', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'other_event',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Unsupported event',
      expected: 'youtube_upload_batch',
    });
  });
});
