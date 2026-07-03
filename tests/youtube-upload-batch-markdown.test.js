import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import routes from '../src/routes/index.js';
import {
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
  youtubeUploadBatchConstants,
  youtubeUploadBatchLimits,
} from '../src/lib/youtubeUploadBatchMarkdown.js';

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use('/api', routes);

  return app;
};

const extractSection = (markdown, label, nextLabel) => {
  const labelWithBreak = `${label}\n`;
  const start = markdown.indexOf(labelWithBreak);
  const end = nextLabel
    ? markdown.indexOf(`\n\n${nextLabel}`, start)
    : markdown.length;

  return markdown.slice(start + labelWithBreak.length, end).trim();
};

describe('youtube_upload_batch markdown webhook', () => {
  it('returns NO_VIDEOS when the payload is empty', () => {
    expect(buildYoutubeUploadBatchMarkdown()).toBe(
      youtubeUploadBatchConstants.noVideosResponse
    );
    expect(buildYoutubeUploadBatchMarkdown({})).toBe(
      youtubeUploadBatchConstants.noVideosResponse
    );
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [],
      })
    ).toBe(youtubeUploadBatchConstants.noVideosResponse);
    expect(
      buildYoutubeUploadBatchMarkdown({
        event: 'youtube_upload_batch',
        videos: [null, 'ignored'],
      })
    ).toBe(youtubeUploadBatchConstants.noVideosResponse);
  });

  it('renders URL, LinkedIn copy and Instagram caption for each video', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Planta industrial en Santiago',
        },
        {
          video_id: 'def456',
          job: {
            project: 'Mantenimiento de sistema de puesta a tierra',
            location: 'Zona norte',
          },
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

  it('keeps social copy within requested length limits', () => {
    const video = {
      job: {
        title:
          'Proyecto corporativo de diagnostico e instalacion de puesta a tierra en terreno',
        description:
          'Revision tecnica para operacion critica con multiples areas y requerimientos internos de mantenimiento preventivo',
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
      youtubeUploadBatchConstants.requiredLinkedInHashtags
    );
  });

  it('does not render restricted Omega figures or SEC certification claims', () => {
    const markdown = buildYoutubeUploadBatchMarkdown({
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Proyecto 0,8 ohm con certificacion SEC, omega y RIC N06',
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
        /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega?s?)\b/i
      );
      expect(copy).not.toMatch(/\b(?:ohm(?:io)?s?|omega?s?)\b/i);
      expect(copy).not.toMatch(
        /\bcert(?:ificacion|ificaci\u00f3n|ificado|\.?)?\s*(?:de\s*)?SEC\b/i
      );
      expect(copy).not.toMatch(/\bSEC\b/i);
      expect(copy).toContain('RIC N06 segun corresponda al proyecto');
    }
  });

  it('returns markdown from webhook endpoints', async () => {
    const app = createTestApp();
    const payload = {
      event: 'youtube_upload_batch',
      videos: [
        {
          video_id: 'abc123',
          url: 'https://youtu.be/abc123',
          job: 'Faena industrial',
        },
      ],
    };

    for (const path of [
      '/api/webhooks',
      '/api/webhooks/youtube-upload-batch',
      '/api/webhooks/youtube_upload_batch',
    ]) {
      const response = await request(app).post(path).send(payload);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^text\/markdown/);
      expect(response.text).toContain('1) URL');
      expect(response.text).toContain('2) Copy LinkedIn empresa');
      expect(response.text).toContain('3) Caption Instagram');
      expect(response.text).not.toMatch(/^\s*\{/);
    }
  });
});
