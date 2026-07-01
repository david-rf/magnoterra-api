import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  markdownConstants,
  renderYouTubeUploadBatchMarkdown,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const readSection = (markdown, label, nextLabel) => {
  const labelWithBreak = `${label}\n`;
  const start = markdown.indexOf(labelWithBreak);
  const end = nextLabel
    ? markdown.indexOf(`\n\n${nextLabel}`, start)
    : markdown.length;

  return markdown.slice(start + labelWithBreak.length, end).trim();
};

describe('YouTube upload batch markdown', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(renderYouTubeUploadBatchMarkdown()).toBe(markdownConstants.NO_VIDEOS_RESPONSE);
    expect(renderYouTubeUploadBatchMarkdown({})).toBe(markdownConstants.NO_VIDEOS_RESPONSE);
    expect(renderYouTubeUploadBatchMarkdown({ videos: [] })).toBe(markdownConstants.NO_VIDEOS_RESPONSE);
    expect(renderYouTubeUploadBatchMarkdown({ videos: [null] })).toBe(markdownConstants.NO_VIDEOS_RESPONSE);
  });

  it('renders one markdown block per video', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Planta industrial en Santiago',
        },
        {
          video_id: 'def456',
          url: 'https://youtu.be/def456',
          job: { project: 'Mantencion de sistema de puesta a tierra' },
        },
      ],
    });

    expect(markdown).toContain('https://youtu.be/abc123');
    expect(markdown).toContain('https://youtu.be/def456');
    expect(markdown.split('\n\n---\n\n')).toHaveLength(2);
  });

  it('keeps LinkedIn copy and Instagram captions within their limits', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Proyecto corporativo con diagnostico e instalacion en terreno',
        },
      ],
    });

    const linkedInCopy = readSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram',
    );
    const instagramCaption = readSection(markdown, '3) Caption Instagram');

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(linkedInCopy).toContain(markdownConstants.CONTACT_CTA);
    expect(linkedInCopy).toContain(markdownConstants.LINKEDIN_HASHTAGS);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('does not render Omega figures or SEC certification claims', () => {
    const markdown = renderYouTubeUploadBatchMarkdown({
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Proyecto 0,8 ohm con certificacion SEC y mejora omega',
        },
      ],
    });

    expect(markdown).not.toMatch(/Ω|ohm|omega|certificaci[oó]n SEC|certificado SEC|\bSEC\b/i);
    expect(markdown).toMatch(/RIC N06.+proyecto/i);
  });

  it('returns markdown from the webhook endpoint', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Faena minera',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/markdown/);
    expect(response.text).toContain('1) URL');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });
});
