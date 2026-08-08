import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  limits,
  renderYoutubeUploadBatchMarkdown,
} from '../src/social/youtubeUploadBatch.js';

const lineValue = (markdown, label) =>
  markdown
    .split('\n')
    .find((line) => line.startsWith(label))
    ?.slice(label.length)
    .trim();

describe('youtube upload batch markdown', () => {
  it('returns NO_VIDEOS for empty or unrelated payloads', () => {
    expect(renderYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(
      renderYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })
    ).toBe('NO_VIDEOS');
    expect(
      renderYoutubeUploadBatchMarkdown({
        event: 'other_event',
        videos: [{ url: 'https://youtu.be/demo', job: 'Demo' }],
      })
    ).toBe('NO_VIDEOS');
  });

  it('renders markdown for each video with required CTA and hashtags', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Mantencion RIC N 06 con certificado SEC y medicion 0.5 ohm para planta industrial',
        },
      ],
    });

    const linkedinCopy = lineValue(markdown, '2) Copy LinkedIn empresa:');
    const instagramCaption = lineValue(markdown, '3) Caption Instagram:');

    expect(markdown).toContain('1) URL: https://youtu.be/abc123');
    expect(linkedinCopy).toContain('https://magnoterra.cl/contacto');
    expect(linkedinCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(instagramCaption).toContain('https://magnoterra.cl/contacto');
    expect(linkedinCopy.length).toBeLessThanOrEqual(limits.linkedin);
    expect(instagramCaption.length).toBeLessThanOrEqual(limits.instagram);
  });

  it('sanitizes restricted claims and conditions RIC N06 references', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          url: 'https://youtu.be/restricted',
          job: 'Inspeccion RIC Nro 06 con acreditacion SEC y resultado 3 omega',
        },
      ],
    });

    expect(markdown).toContain('RIC N06 cuando aplica al proyecto');
    expect(markdown).not.toMatch(
      /\b\d+(?:[.,]\d+)?\s*(ohm|omega|\u03a9|\u2126)\b/iu
    );
    expect(markdown).not.toMatch(/\bSEC\b/u);
    expect(markdown).not.toMatch(
      /\bcertificado\b|\bcertificacion\b|\bacreditacion\b/iu
    );
  });

  it('falls back to a YouTube watch URL when only video_id is present', () => {
    const markdown = renderYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [{ video_id: 'id with space', job: 'Video tecnico' }],
    });

    expect(markdown).toContain(
      '1) URL: https://www.youtube.com/watch?v=id%20with%20space'
    );
  });
});

describe('youtube upload batch route', () => {
  it('responds with text markdown for webhook payloads', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', routes);

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [{ url: 'https://youtu.be/route', job: 'Puesta a tierra' }],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL: https://youtu.be/route');
    expect(response.text).toContain('2) Copy LinkedIn empresa:');
    expect(response.text).toContain('3) Caption Instagram:');
  });
});
