import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import {
  buildYouTubeUploadBatchMarkdown,
  NO_VIDEOS_RESPONSE,
} from '../src/webhooks/youtubeUploadBatch.js';

const extractSection = (markdown, startLabel, endLabel) => {
  const pattern = new RegExp(`${startLabel}\\n\\n([\\s\\S]*?)\\n\\n${endLabel}`);
  const match = markdown.match(pattern);

  return match ? match[1] : '';
};

describe('YouTube upload batch webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.text).toBe(NO_VIDEOS_RESPONSE);
    expect(response.headers['content-type']).toContain('text/markdown');
  });

  it('builds markdown copy for each video within channel limits', () => {
    const markdown = buildYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/example',
          job: 'Malla industrial con 10 ohm, certificacion SEC y revision RIC N06',
        },
      ],
    });

    const linkedInCopy = extractSection(
      markdown,
      '2\\) Copy LinkedIn empresa',
      '3\\) Caption Instagram',
    );
    const instagramCaption = markdown.split('3) Caption Instagram\n\n')[1];

    expect(markdown).toContain('1) URL\n\nhttps://youtu.be/example');
    expect(markdown).toContain('magnoterra.cl/contacto');
    expect(markdown).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(markdown).toContain('RIC N06');
    expect(markdown).not.toMatch(/\b(?:ohm|omega|sec)\b/i);
    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
  });

  it('separates multiple videos in the markdown response', () => {
    const markdown = buildYouTubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'yt-001',
          url: 'https://youtu.be/one',
          job: 'Proyecto comercial',
        },
        {
          video_id: 'yt-002',
          url: 'https://youtu.be/two',
          job: 'Proyecto industrial',
        },
      ],
    });

    expect(markdown).toContain('### Video 1 - yt-001');
    expect(markdown).toContain('### Video 2 - yt-002');
    expect(markdown).toContain('\n\n---\n\n');
  });
});
