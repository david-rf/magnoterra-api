import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  youtubeUploadBatchLimits,
} from '../src/social/youtubeUploadBatchMarkdown.js';

const textBetween = (value, startLabel, endLabel) => {
  const start = value.indexOf(startLabel);
  const end = value.indexOf(endLabel);

  if (start === -1 || end === -1 || end <= start) {
    return '';
  }

  return value.slice(start + startLabel.length, end).trim();
};

const textAfter = (value, label) => {
  const start = value.indexOf(label);

  return start === -1 ? '' : value.slice(start + label.length).trim();
};

describe('YouTube upload batch webhook', () => {
  it('responds NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('responds NO_VIDEOS when the batch has no renderable videos', async () => {
    const response = await request(app).post('/api/webhooks').send({
      event: 'youtube_upload_batch',
      videos: [],
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('renders one markdown block per video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'mantencion de malla para planta industrial',
          },
          {
            video_id: 'def456',
            url: 'https://youtu.be/def456',
            job: { title: 'diagnostico de sistema de puesta a tierra' },
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
    expect(response.text).toContain('\n\n---\n\n');
  });

  it('uses video_id as a YouTube URL fallback', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube_upload_batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ video_id: 'abc 123', job: 'puesta a tierra' }],
      });

    expect(response.status).toBe(200);
    expect(response.text).toContain(
      '1) URL\nhttps://www.youtube.com/watch?v=abc%20123'
    );
  });

  it('keeps social copy within requested character limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: { description: 'x'.repeat(1000) },
        },
      ],
    });

    const linkedInCopy = textBetween(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = textAfter(markdown, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.linkedIn
    );
    expect(instagramCaption.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.instagram
    );
  });

  it('removes restricted claims and conditions RIC N06 references', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: 'medicion 0,5 \u03a9 con certificado SEC y RIC N06',
        },
      ],
    });

    expect(markdown).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega(?:s)?|[\u03a9\u03c9\u2126])/i
    );
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).toContain('RIC N06 segun condiciones del proyecto');
  });

  it('returns markdown for unsupported generic webhook events', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'other_event',
        videos: [{ url: 'https://youtu.be/abc123' }],
      });

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('UNSUPPORTED_EVENT');
  });
});
