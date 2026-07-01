import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { buildYoutubeUploadBatchMarkdown } from '../src/social/youtubeUploadMarkdown.js';

const getMarkdownField = (markdown, label) => {
  const line = markdown
    .split('\n')
    .find(
      (item) =>
        item.startsWith(`2. **${label}:** `) ||
        item.startsWith(`3. **${label}:** `)
    );

  return line.replace(/^\.?[\d]+\. \*\*[^:]+:\*\* /, '');
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for an empty payload', async () => {
    const response = await request(app)
      .post('/api/webhooks')
      .send({ event: 'youtube_upload_batch', videos: [] });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for each uploaded video', async () => {
    const payload = {
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-1',
          url: 'https://youtu.be/example-1',
          job: {
            title: 'Medicion de puesta a tierra 5 \u03a9 con certificacion SEC',
          },
        },
        {
          video_id: 'yt-2',
          url: 'https://youtu.be/example-2',
          job: 'Mantencion preventiva y revision RIC N06',
        },
      ],
    };

    const response = await request(app).post('/api/webhooks').send(payload);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('### Video 1');
    expect(response.text).toContain('### Video 2');
    expect(response.text).toContain('1. **URL:** https://youtu.be/example-1');
    expect(response.text).toContain('1. **URL:** https://youtu.be/example-2');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).toContain('RIC N06');
    expect(response.text).not.toMatch(/\u03a9|omega|ohm|certificacion SEC/i);
  });

  it('keeps generated social copy inside channel limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      videos: [
        {
          url: 'https://youtu.be/example',
          job: {
            description: 'a'.repeat(1000),
          },
        },
      ],
    });

    const linkedinCopy = getMarkdownField(markdown, 'Copy LinkedIn empresa');
    const instagramCaption = getMarkdownField(markdown, 'Caption Instagram');

    expect(linkedinCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });
});
