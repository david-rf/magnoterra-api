const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const LINKEDIN_JOB_MAX_LENGTH = 180;
const INSTAGRAM_JOB_MAX_LENGTH = 120;
const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const forbiddenPatterns = [
  /omega/i,
  /\u03a9/,
  /\u2126/,
  /cert\.?\s*SEC/i,
  /certificaci[oó]n\s+SEC/i,
];

const getJobText = (job) => {
  if (!job) {
    return 'sistemas de puesta a tierra';
  }

  if (typeof job === 'string') {
    return job;
  }

  if (typeof job === 'object') {
    const values = [
      job.title,
      job.name,
      job.type,
      job.service,
      job.description,
      job.location,
    ].filter(Boolean);

    return values.length > 0 ? values.join(' - ') : 'sistemas de puesta a tierra';
  }

  return String(job);
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const trimToLimit = (value, limit) => {
  if (value.length <= limit) {
    return value;
  }

  const trimmed = value.slice(0, limit - 1).trimEnd();
  const lastSpace = trimmed.lastIndexOf(' ');

  return `${trimmed.slice(0, lastSpace > 0 ? lastSpace : trimmed.length).trimEnd()}.`;
};

const sanitizeCopy = (value) => {
  let sanitized = value;

  for (const pattern of forbiddenPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return normalizeWhitespace(sanitized);
};

const buildLinkedInCopy = (video) => {
  const jobText = trimToLimit(sanitizeCopy(getJobText(video.job)), LINKEDIN_JOB_MAX_LENGTH);
  const copy = [
    `Compartimos un nuevo registro de nuestro trabajo en ${jobText}.`,
    'En Magno Terra abordamos cada proyecto de puesta a tierra con criterio tecnico, trazabilidad y foco en una ejecucion segura para instalaciones en Chile.',
    'La aplicacion de RIC N06 siempre debe evaluarse segun las condiciones y alcance de cada proyecto.',
    `Conversemos sobre tu necesidad: ${CONTACT_CTA}`,
    REQUIRED_HASHTAGS,
  ].join(' ');

  return trimToLimit(sanitizeCopy(copy), LINKEDIN_MAX_LENGTH);
};

const buildInstagramCaption = (video) => {
  const jobText = trimToLimit(sanitizeCopy(getJobText(video.job)), INSTAGRAM_JOB_MAX_LENGTH);
  const caption = [
    `Nuevo registro en terreno: ${jobText}.`,
    'Puesta a tierra con foco tecnico, seguridad y ejecucion responsable.',
    `Agenda tu consulta en ${CONTACT_CTA}`,
  ].join(' ');

  return trimToLimit(sanitizeCopy(caption), INSTAGRAM_MAX_LENGTH);
};

const getVideoUrl = (video) => video?.url || '';

const getVideoLabel = (video, index) => video?.video_id || `video-${index + 1}`;

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video, index) => {
    const label = getVideoLabel(video, index);
    const url = getVideoUrl(video);
    const linkedInCopy = buildLinkedInCopy(video);
    const instagramCaption = buildInstagramCaption(video);

    return [
      `### ${label}`,
      '',
      `1) URL: ${url}`,
      '',
      '2) Copy LinkedIn empresa:',
      linkedInCopy,
      '',
      '3) Caption Instagram:',
      instagramCaption,
    ].join('\n');
  }).join('\n\n---\n\n');
};

export const isYoutubeUploadBatchPayload = (payload = {}) => (
  payload?.event === 'youtube_upload_batch' || Array.isArray(payload?.videos)
);
