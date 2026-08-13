import { URL } from 'node:url';
import { z } from 'zod';

const CONTACT_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_JOB = 'proyecto de puesta a tierra';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;

const videoSchema = z.object({
  video_id: z.union([z.string(), z.number()]).optional(),
  url: z.string().trim().min(1).refine(isHttpUrl),
  job: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const payloadSchema = z.object({
  event: z.literal('youtube_upload_batch'),
  videos: z.array(videoSchema),
}).passthrough();

export class MarkdownWebhookError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'MarkdownWebhookError';
    this.status = status;
  }
}

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'NO_VIDEOS';
  }

  if (!Array.isArray(payload.videos) || payload.videos.length === 0) {
    return 'NO_VIDEOS';
  }

  const result = payloadSchema.safeParse(payload);

  if (!result.success) {
    const hasInvalidEvent = result.error.issues.some((issue) => issue.path[0] === 'event');
    throw new MarkdownWebhookError(hasInvalidEvent ? 'INVALID_EVENT' : 'INVALID_PAYLOAD');
  }

  return result.data.videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

const formatVideoMarkdown = (video) => {
  const job = normalizeJob(video.job);
  const linkedinCopy = fitLinkedInCopy(job);
  const instagramCaption = fitInstagramCaption(job);
  const title = video.video_id ? `### Video ${sanitizeMarkdownText(video.video_id)}` : '### Video';

  return [
    title,
    '',
    '1) URL',
    video.url,
    '',
    '2) Copy LinkedIn empresa',
    linkedinCopy,
    '',
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n');
};

const fitLinkedInCopy = (job) => {
  const makeCopy = (jobText) => [
    `Nuevo video de Magno Terra: ${jobText}.`,
    'En proyectos de puesta a tierra, cada terreno e instalacion requieren criterios tecnicos definidos desde la ingenieria y la normativa aplicable.',
    'Compartimos este registro para mostrar como abordamos la continuidad operacional con foco en seguridad, trazabilidad y soluciones ajustadas al proyecto.',
    `Conversemos sobre tu proyecto en ${CONTACT_URL}`,
    '',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return fitCopy(makeCopy, job, MAX_LINKEDIN_CHARS);
};

const fitInstagramCaption = (job) => {
  const makeCaption = (jobText) => [
    `Nuevo registro en terreno: ${jobText}.`,
    'Puesta a tierra con mirada tecnica, foco en seguridad y solucion ajustada a cada proyecto.',
    '',
    `Contacto: ${CONTACT_URL}`,
    '',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return fitCopy(makeCaption, job, MAX_INSTAGRAM_CHARS);
};

const fitCopy = (builder, job, maxChars) => {
  let jobText = job;
  let copy = builder(jobText);

  while (copy.length > maxChars && jobText.length > DEFAULT_JOB.length) {
    jobText = truncateText(jobText, Math.max(DEFAULT_JOB.length, jobText.length - 20));
    copy = builder(jobText);
  }

  return copy.length <= maxChars ? copy : builder(DEFAULT_JOB);
};

const normalizeJob = (value) => {
  const sanitized = sanitizeMarketingText(value);
  return sanitized || DEFAULT_JOB;
};

const sanitizeMarketingText = (value) => {
  return sanitizeMarkdownText(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega|\u03a9|\u2126)\b/gi, '')
    .replace(/\b(?:ohms?|omega)\b|[\u03a9\u2126]/gi, '')
    .replace(/\b(?:cert(?:ificado|ificacion)?\s*)?SEC\b/gi, '')
    .replace(/\bRIC\s*N\s*0?6\b/gi, '')
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[.,;: -]+$/, '');
};

const sanitizeMarkdownText = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const truncateText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

function isHttpUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}
