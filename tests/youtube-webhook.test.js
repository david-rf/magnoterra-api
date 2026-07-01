import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  NO_VIDEOS_RESPONSE,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeBatchMarkdown.js';

const extractSection = (markdown, startLabel, endLabel) => {
  const [, section = ''] =
    markdown.match(
      new RegExp(`${startLabel}\\n([\\s\\S]*?)\\n\\n${endLabel}`)
    ) ?? [];
  return section;
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.type).toContain('text/markdown');
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
  });

  it('renders one markdown block per uploaded video', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Instalacion minera con 5 ohms, certificacion SEC y revision RIC N06',
          },
        ],
      });

    const linkedInCopy = extractSection(
      response.text,
      '2\\) Copy LinkedIn empresa',
      '3\\) Caption Instagram'
    );
    const instagramCaption = response.text.split('3) Caption Instagram\n')[1];

    expect(response.status).toBe(200);
    expect(response.type).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedInCopy).toContain('Cuando el proyecto lo requiere');
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(response.text).not.toMatch(/\bSEC\b|ohms?|omega|[\u03a9\u03c9]/i);
  });

  it('falls back to a YouTube URL when only video_id is provided', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'video with spaces',
          job: {
            title: 'Proyecto industrial',
            city: 'Santiago',
          },
        },
      ],
    });

    expect(markdown).toContain(
      'https://www.youtube.com/watch?v=video%20with%20spaces'
    );
    expect(markdown).toContain('Proyecto industrial - Santiago');
  });

  it('rejects unsupported event names', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({
        event: 'other_event',
        videos: [{ url: 'https://youtu.be/abc123' }],
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('UNSUPPORTED_EVENT');
  });
});
