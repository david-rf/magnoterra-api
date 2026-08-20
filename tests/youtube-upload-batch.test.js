import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const getSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = markdown.indexOf(endLabel);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for every uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://www.youtube.com/watch?v=abc123',
            job: 'Instalacion industrial con medicion 2 Ohm, certificacion SEC y RIC N06 garantizado',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('### Video 1');
    expect(response.text).toContain('1) URL');
    expect(response.text).toContain('https://www.youtube.com/watch?v=abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');

    const linkedInCopy = getSection(
      response.text,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = response.text
      .slice(
        response.text.indexOf('3) Caption Instagram') +
          '3) Caption Instagram'.length
      )
      .trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('https://magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(`${linkedInCopy}\n${instagramCaption}`).not.toMatch(
      /\b(?:ohms?|omega|SEC)\b|Ω/i
    );
    expect(linkedInCopy).toMatch(/RIC N06 segun el alcance del proyecto/);
  });

  it('returns NO_VIDEOS when videos is missing', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'youtube_upload_batch' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });
});
