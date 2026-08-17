import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  limits,
} from '../src/social/youtubeUploadBatch.js';

const getSection = (markdown, startMarker, endMarker) => {
  const start = markdown.indexOf(startMarker);
  const end = markdown.indexOf(endMarker);

  return markdown.slice(start + startMarker.length, end).trim();
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('formats each video as markdown with safe social copy', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example',
          job:
            'Medicion RIC N06 con 5 \u03a9 y certificacion SEC para planta industrial',
        },
      ],
    });

    const linkedInCopy = getSection(
      markdown,
      '2) Copy LinkedIn empresa:',
      '3) Caption Instagram:'
    );
    const instagramCaption = markdown
      .slice(markdown.indexOf('3) Caption Instagram:') + 22)
      .trim();

    expect(markdown).toContain('1) URL: https://youtu.be/example');
    expect(linkedInCopy.length).toBeLessThanOrEqual(limits.linkedIn);
    expect(instagramCaption.length).toBeLessThanOrEqual(limits.instagram);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).not.toMatch(/5\s*(?:\u03a9|ohm|omega)/i);
    expect(markdown).not.toMatch(/\bSEC\b/i);
    expect(markdown).toContain('RIC N06, segun corresponda al proyecto');
  });
});
