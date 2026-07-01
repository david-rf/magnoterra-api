import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when payload has no videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
    expect(response.headers['content-type']).toContain('text/markdown');
  });

  it('renders markdown for every uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Inspeccion de puesta a tierra industrial',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: {
              title: 'Mantenimiento preventivo',
              summary: 'Aplicacion de RIC N06 segun proyecto',
            },
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('## Video 1');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(response.text).toContain('## Video 2');
    expect(response.text).toContain('1) URL: https://youtu.be/def456');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
  });

  it('omits forbidden claims and keeps copy length limits', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            job: 'Medicion 3.5 ohm con certificacion SEC y valor 2 Ω para RIC N06',
          },
        ],
      });

    const linkedinCopy = response.text.match(/2\) Copy LinkedIn empresa: (.+)/)?.[1];
    const instagramCaption = response.text.match(/3\) Caption Instagram: (.+)/)?.[1];

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL: https://www.youtube.com/watch?v=abc123');
    expect(response.text).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega|omegas|Ω)\b/i);
    expect(response.text).not.toMatch(/\bSEC\b/i);
    expect(response.text).toContain(
      'La aplicacion de RIC N06 debe evaluarse segun el alcance y las condiciones de cada proyecto.',
    );
    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });
});
