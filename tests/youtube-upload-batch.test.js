import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import routes from '../src/routes/index.js';
import {
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  NO_VIDEOS_RESPONSE,
  renderYoutubeUploadBatchMarkdown,
  YOUTUBE_UPLOAD_BATCH_EVENT,
} from '../src/social/youtubeUploadBatch.js';

const extractBetween = (markdown, startMarker, endMarker) => {
  const start = markdown.indexOf(startMarker);
  const end = markdown.indexOf(endMarker, start);

  return markdown.slice(start + startMarker.length, end).trim();
};

const extractAfter = (markdown, marker) => {
  const start = markdown.indexOf(marker);

  return markdown.slice(start + marker.length).trim();
};

const buildApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS for empty payloads', () => {
    expect(renderYoutubeUploadBatchMarkdown()).toBe(NO_VIDEOS_RESPONSE);
    expect(renderYoutubeUploadBatchMarkdown({})).toBe(NO_VIDEOS_RESPONSE);
    expect(renderYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [],
    })).toBe(NO_VIDEOS_RESPONSE);
  });

  it('renders one markdown block per video', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [
        {
          video_id: 'yt-1',
          url: 'https://youtu.be/one',
          job: 'Proyecto industrial',
        },
        {
          video_id: 'yt-2',
          url: 'https://youtu.be/two',
          job: 'Obra comercial',
        },
      ],
    });

    expect(markdown).toContain('### Video 1');
    expect(markdown).toContain('https://youtu.be/one');
    expect(markdown).toContain('### Video 2');
    expect(markdown).toContain('https://youtu.be/two');
    expect(markdown).not.toContain('{');
    expect(markdown).not.toContain('}');
  });

  it('keeps social copy within requested limits and required wording', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: YOUTUBE_UPLOAD_BATCH_EVENT,
      videos: [{ url: 'https://youtu.be/example' }],
    });
    const linkedinCopy = extractBetween(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram',
    );
    const instagramCaption = extractAfter(markdown, '3) Caption Instagram');

    expect(linkedinCopy.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
    expect(instagramCaption.length).toBeLessThanOrEqual(INSTAGRAM_LIMIT);
    expect(linkedinCopy).toContain('magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toContain('Omega');
    expect(markdown).not.toContain('Ω');
    expect(markdown).not.toContain('cert SEC');
    expect(markdown).not.toContain('RIC N06');
  });

  it('serves markdown from the webhook route', async () => {
    const response = await request(buildApp())
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: YOUTUBE_UPLOAD_BATCH_EVENT,
        videos: [{ url: 'https://youtu.be/route' }],
      });

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/markdown');
    expect(response.text).toContain('https://youtu.be/route');
    expect(response.text).toContain('Copy LinkedIn empresa');
  });
});
