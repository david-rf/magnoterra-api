import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  MAX_INSTAGRAM_CHARS,
  MAX_LINKEDIN_CHARS,
} from '../src/lib/youtubeSocialCopy.js';

const extractSection = (markdown, heading, nextHeading) => {
  const start = markdown.indexOf(heading);
  const end = markdown.indexOf(nextHeading, start + heading.length);

  return markdown.slice(start + heading.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app).post('/api/webhooks/youtube-upload-batch').send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
    expect(response.headers['content-type']).toContain('text/markdown');
  });

  it('returns NO_VIDEOS when the batch has no usable videos', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [],
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown social copy', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Mantencion puesta a tierra planta norte 3.2 \u03a9 con certificaci\u00f3n SEC',
          },
        ],
      });

    const linkedInCopy = extractSection(
      response.text,
      '2) Copy LinkedIn empresa:',
      '3) Caption Instagram:'
    );
    const instagramCaption = response.text.split('3) Caption Instagram:')[1].trim();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedInCopy.length).toBeLessThanOrEqual(MAX_LINKEDIN_CHARS);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption.length).toBeLessThanOrEqual(MAX_INSTAGRAM_CHARS);
    expect(response.text).toContain('RIC N06 queda condicionad');
    expect(response.text).not.toMatch(/\bSEC\b|ohm|omega|[\u03a9\u03c9]|\b3\.2\b/iu);
  });

  it('separates multiple videos and builds a URL from video_id when needed', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'first-video',
            job: 'Inspeccion tecnica en terreno',
          },
          {
            video_id: 'second-video',
            url: 'https://youtu.be/second-video',
            job: { service: 'Medicion preventiva', region: 'Chile' },
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain('1) URL: https://www.youtube.com/watch?v=first-video');
    expect(response.text).toContain('1) URL: https://youtu.be/second-video');
    expect(response.text).toContain('\n\n---\n\n');
  });
});
