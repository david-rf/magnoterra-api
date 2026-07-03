import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYoutubeUploadBatchMarkdown,
  youtubeUploadBatchLimits,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

function getField(markdown, label, nextLabel) {
  const start = markdown.indexOf(label);
  const end = markdown.indexOf(nextLabel, start + label.length);

  return markdown.slice(start + label.length, end).trim();
}

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS for empty payloads', async () => {
    const response = await request(app).post('/api/webhooks').send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('returns markdown copy for each video', async () => {
    const payload = {
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: {
            title: 'Medicion 5\u03a9 con cert SEC en sala electrica',
            location: 'Santiago',
          },
        },
        {
          video_id: 'def456',
          job: 'malla de puesta a tierra para industria',
        },
      ],
    };

    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.text).toContain('### Video 1');
    expect(response.text).toContain('https://youtu.be/abc123');
    expect(response.text).toContain('### Video 2');
    expect(response.text).toContain('https://www.youtube.com/watch?v=def456');
    expect(response.text).toContain('magnoterra.cl/contacto');
    expect(response.text).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(response.text).not.toMatch(/[\u03a9\u2126]/);
    expect(response.text).not.toMatch(/\bohms?\b/i);
    expect(response.text).not.toMatch(/\bSEC\b/);
  });

  it('keeps generated LinkedIn and Instagram text within limits', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: 'diagnostico de puesta a tierra para proyecto comercial',
        },
      ],
    });
    const linkedInCopy = getField(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = markdown
      .slice(markdown.indexOf('3) Caption Instagram'))
      .replace('3) Caption Instagram', '')
      .trim();

    expect(linkedInCopy.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.linkedIn
    );
    expect(instagramCaption.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.instagram
    );
    expect(linkedInCopy).toContain('RIC N06 se considera cuando corresponde');
    expect(instagramCaption).toContain('RIC N06 aplica segun el proyecto');
  });
});
