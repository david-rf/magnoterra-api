import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

const extractSections = (markdown) => markdown.split('\n\n---\n\n');

const extractLinkedInCopy = (section) => {
  const match = section.match(/2\) Copy LinkedIn empresa:\n([\s\S]*?)\n\n3\) Caption Instagram:/);
  return match?.[1] ?? '';
};

const extractInstagramCaption = (section) => {
  const match = section.match(/3\) Caption Instagram:\n([\s\S]*)$/);
  return match?.[1] ?? '';
};

describe('YouTube upload batch webhook', () => {
  it('should return NO_VIDEOS for an empty payload', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({});

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.text).toBe('NO_VIDEOS');
  });

  it('should render one markdown block per video', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'abc123',
            url: 'https://youtu.be/abc123',
            job: 'Mantenimiento industrial con certificado SEC y medicion 5 Ohm',
          },
          {
            video_id: 'def456',
            job: {
              title: 'Instalacion de malla a tierra',
              comuna: 'Valparaiso',
              description: 'Proyecto con objetivo 3 Ω para faena minera',
            },
          },
        ],
      });

    expect(response.status).toBe(200);

    const sections = extractSections(response.text);
    expect(sections).toHaveLength(2);
    expect(sections[0]).toContain('1) URL: https://youtu.be/abc123');
    expect(sections[1]).toContain('1) URL: https://www.youtube.com/watch?v=def456');
  });

  it('should enforce copy constraints and required CTA/hashtags', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({
        event: 'youtube_upload_batch',
        videos: [
          {
            video_id: 'ghi789',
            url: 'https://youtu.be/ghi789',
            job: 'Auditoria de puesta a tierra con certificacion SEC, meta 2.5 omega y seguimiento normativo para planta productiva',
          },
        ],
      });

    const [section] = extractSections(response.text);
    const linkedInCopy = extractLinkedInCopy(section);
    const instagramCaption = extractInstagramCaption(section);

    expect(linkedInCopy.length).toBeLessThanOrEqual(900);
    expect(instagramCaption.length).toBeLessThanOrEqual(500);
    expect(linkedInCopy).toContain('magnoterra.cl/contacto');
    expect(linkedInCopy).toContain('#PuestaATierra #Chile #MagnoTerra');
    expect(linkedInCopy).toContain('RIC N06 cuando corresponda');
    expect(`${linkedInCopy} ${instagramCaption}`).not.toMatch(/SEC|ohm|omega|Ω/i);
  });

  it('should reject unexpected event types', async () => {
    const response = await request(app)
      .post('/api/webhooks/youtube-upload-batch')
      .send({ event: 'other_event', videos: [] });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('expected', 'youtube_upload_batch');
  });
});
