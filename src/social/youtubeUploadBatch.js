import { z } from 'zod';

export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_URL = 'magnoterra.cl/contacto';

const youtubeVideoSchema = z.object({
  video_id: z.union([z.string(), z.number()]).optional(),
  url: z.string().min(1).transform((value) => sanitizeMarkdownLine(value)),
  job: z.unknown().optional(),
}).passthrough();

const youtubeUploadBatchSchema = z.object({
  event: z.literal(YOUTUBE_UPLOAD_BATCH_EVENT),
  videos: z.array(youtubeVideoSchema),
}).passthrough();

const linkedInCopy = [
  'Nuevo video de Magno Terra: compartimos una mirada practica sobre puesta a tierra y continuidad operacional para proyectos en Chile.',
  'Acompanamos diagnostico, diseno e implementacion con criterios tecnicos y RIC N06 segun las condiciones de cada proyecto, priorizando seguridad, trazabilidad y soluciones mantenibles.',
  `Conversemos sobre tu caso: ${CONTACT_URL} #PuestaATierra #Chile #MagnoTerra`,
].join(' ');

const instagramCaption = [
  'Nuevo video de Magno Terra sobre puesta a tierra para proyectos en Chile.',
  'Revisamos criterios aplicables caso a caso y RIC N06 segun las condiciones del proyecto, siempre con foco en seguridad y continuidad.',
  `Contacto: ${CONTACT_URL}`,
].join(' ');

const sanitizeMarkdownLine = (value) => value.replace(/[\r\n]+/g, ' ').trim();

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const createValidationError = (details) => {
  const error = new Error('Invalid youtube_upload_batch webhook payload');
  error.status = 400;
  error.details = details;
  return error;
};

const formatVideoMarkdown = (video) => [
  `1) URL: ${video.url}`,
  `2) Copy LinkedIn empresa: ${truncate(linkedInCopy, 900)}`,
  `3) Caption Instagram: ${truncate(instagramCaption, 500)}`,
].join('\n');

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (!payload || !Array.isArray(payload.videos) || payload.videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  const parsedPayload = youtubeUploadBatchSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw createValidationError(parsedPayload.error.flatten());
  }

  return parsedPayload.data.videos.map(formatVideoMarkdown).join('\n\n');
};
