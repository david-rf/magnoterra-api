import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import routes from '../src/routes/index.js';
import {
  buildLinkedInCopy,
  buildInstagramCaption,
  buildYoutubeUploadBatchMarkdown,
  youtubeUploadBatchConstants,
  youtubeUploadBatchLimits,
} from '../src/social/youtubeUploadBatch.js';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const extractSection = (markdown, startLabel, endLabel) => {
  const start = markdown.indexOf(startLabel);
  const end = endLabel ? markdown.indexOf(endLabel, start) : markdown.length;

  if (start === -1 || end === -1 || end <= start) {
    return '';
  }

  return markdown.slice(start + startLabel.length, end).trim();
};

describe('youtube_upload_batch webhook markdown', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown({})).toBe('NO_VIDEOS');
    expect(buildYoutubeUploadBatchMarkdown()).toBe('NO_VIDEOS');
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe('NO_VIDEOS');
  });

  it('renders URL, LinkedIn copy and Instagram caption for each video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'mantencion preventiva de malla a tierra industrial',
        },
        {
          video_id: 'def456',
          job: 'diagnostico para proyecto minero',
        },
      ],
    });

    expect(markdown).toContain('1) URL\nhttps://youtu.be/abc123');
    expect(markdown).toContain(
      '1) URL\nhttps://www.youtube.com/watch?v=def456'
    );
    expect(markdown.match(/2\) Copy LinkedIn empresa/g)).toHaveLength(2);
    expect(markdown.match(/3\) Caption Instagram/g)).toHaveLength(2);
    expect(markdown).toContain('\n\n---\n\n');
  });

  it('keeps channel copy inside limits and required LinkedIn CTA/hashtags', () => {
    const video = {
      job: {
        title: 'x'.repeat(500),
        region: 'Chile',
      },
    };
    const linkedInCopy = buildLinkedInCopy(video);
    const instagramCaption = buildInstagramCaption(video);

    expect(linkedInCopy.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.linkedIn
    );
    expect(instagramCaption.length).toBeLessThanOrEqual(
      youtubeUploadBatchLimits.instagram
    );
    expect(linkedInCopy).toContain(youtubeUploadBatchConstants.contactCta);
    expect(linkedInCopy).toContain(
      youtubeUploadBatchConstants.requiredHashtags
    );
    expect(instagramCaption).toContain(
      youtubeUploadBatchConstants.requiredHashtags
    );
  });

  it('removes restricted Omega figures and SEC certification claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          job: 'medicion 0,5 ohm con certificado SEC y RIC N06',
        },
      ],
    });
    const linkedInCopy = extractSection(
      markdown,
      '2) Copy LinkedIn empresa',
      '3) Caption Instagram'
    );
    const instagramCaption = extractSection(markdown, '3) Caption Instagram');

    for (const copy of [linkedInCopy, instagramCaption]) {
      expect(copy).not.toMatch(
        /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s|ios?)?|omega|[\u03a9\u03c9])\b/i
      );
      expect(copy).not.toMatch(
        /\b(?:cert(?:ificacion|ificado)?|cert\.?)\s*(?:de\s*)?SEC\b/i
      );
      expect(copy).toContain('RIC N06 segun corresponda al proyecto');
    }
  });

  it('responds with markdown from POST /api/webhooks', async () => {
    const response = await request(createTestApp())
      .post('/api/webhooks')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'puesta a tierra',
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toContain('1) URL');
    expect(response.text).toContain('2) Copy LinkedIn empresa');
    expect(response.text).toContain('3) Caption Instagram');
  });
});
