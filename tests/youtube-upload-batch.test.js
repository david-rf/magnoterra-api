import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  formatYoutubeUploadBatchMarkdown,
  markdownLimits,
} from '../src/social/youtubeUploadBatchMarkdown.js';

const getSection = (markdown, startHeading, endHeading) => {
  const startIndex = markdown.indexOf(startHeading);
  const contentStart = startIndex + startHeading.length;
  const endIndex = endHeading ? markdown.indexOf(endHeading, contentStart) : markdown.length;

  return markdown.slice(contentStart, endIndex).trim();
};

describe('formatYoutubeUploadBatchMarkdown', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(formatYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch', videos: [] })).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown with bounded copy', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://www.youtube.com/watch?v=abc123',
          job: {
            title: 'Certificacion SEC y RIC N06 con 5 Ω para malla industrial',
          },
        },
      ],
    });

    const linkedInCopy = getSection(markdown, '2) Copy LinkedIn empresa', '3) Caption Instagram');
    const instagramCaption = getSection(markdown, '3) Caption Instagram');

    expect(markdown).toContain('1) URL\nhttps://www.youtube.com/watch?v=abc123');
    expect(linkedInCopy.length).toBeLessThanOrEqual(markdownLimits.linkedin);
    expect(instagramCaption.length).toBeLessThanOrEqual(markdownLimits.instagram);
    expect(linkedInCopy).toContain('https://magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s|ios?)?|omega|Ω)\b/i);
    expect(markdown).toContain('criterios normativos aplicables segun el proyecto');
  });

  it('formats multiple videos without non-markdown wrappers', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'one',
          url: 'https://youtu.be/one',
          job: 'Revision de puesta a tierra comercial',
        },
        {
          video_id: 'two',
          url: 'https://youtu.be/two',
          job: 'Mantencion preventiva',
        },
      ],
    });

    expect(markdown.match(/1\) URL/g)).toHaveLength(2);
    expect(markdown).toContain('https://youtu.be/one');
    expect(markdown).toContain('https://youtu.be/two');
  });
});

describe('youtube upload batch webhook route', () => {
  it('responds with markdown text', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://www.youtube.com/watch?v=abc123',
            job: 'Video sobre medicion y mantenimiento',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL\nhttps://www.youtube.com/watch?v=abc123');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });
});
