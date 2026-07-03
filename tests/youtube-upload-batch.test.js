import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  createYoutubeUploadCopy,
  formatYoutubeUploadBatchMarkdown,
  limits,
} from '../src/social/youtubeUploadBatch.js';

describe('YouTube upload batch social copy', () => {
  it('returns NO_VIDEOS when the payload has no videos', () => {
    expect(
      formatYoutubeUploadBatchMarkdown({ event: 'youtube_upload_batch' })
    ).toBe('NO_VIDEOS');
    expect(
      formatYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
  });

  it('generates markdown-only blocks for every video', () => {
    const markdown = formatYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc-123_X',
          url: 'https://youtu.be/abc-123_X',
          job: {
            title: 'Instalacion malla tierra',
            location: 'Chile',
          },
        },
        {
          video_id: 'def-456_Y',
          job: 'mantencion puesta a tierra',
        },
      ],
    });

    expect(markdown).toContain('1. URL: https://youtu.be/abc-123_X');
    expect(markdown).toContain(
      '1. URL: https://www.youtube.com/watch?v=def-456_Y'
    );
    expect(markdown.match(/2\. Copy LinkedIn empresa:/g)).toHaveLength(2);
    expect(markdown.match(/3\. Caption Instagram:/g)).toHaveLength(2);
  });

  it('responds with markdown from the webhook route', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'route-test',
            url: 'https://youtu.be/route-test',
            job: 'puesta a tierra comercial',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1. URL: https://youtu.be/route-test');
    expect(response.text).toContain('2. Copy LinkedIn empresa:');
    expect(response.text).toContain('3. Caption Instagram:');
  });

  it('keeps required LinkedIn content within limits', () => {
    const copy = createYoutubeUploadCopy({
      url: 'https://youtu.be/example',
      job: {
        title: 'Proyecto industrial con medicion 10 Ω y certificado SEC',
        description: 'Descripcion extensa '.repeat(80),
      },
    });

    expect(copy.linkedin.length).toBeLessThanOrEqual(limits.linkedin);
    expect(copy.instagram.length).toBeLessThanOrEqual(limits.instagram);
    expect(copy.linkedin).toContain('magnoterra.cl/contacto');
    expect(copy.linkedin).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(copy.linkedin).toContain(
      'La aplicacion de RIC N06 se evalua segun las condiciones del proyecto.'
    );
    expect(copy.linkedin).not.toMatch(/SEC|Ω|\b10\s*(?:ohm|omega)\b/i);
    expect(copy.instagram).not.toMatch(/SEC|Ω|\b10\s*(?:ohm|omega)\b/i);
  });
});
