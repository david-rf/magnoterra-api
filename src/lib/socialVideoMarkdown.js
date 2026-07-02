const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const JOB_MAX_LENGTH = 80;

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:Ω|ohms?|ohmios?)\b/gi,
  /\b(?:cert(?:ificacion|ificación)?|cert\.?)\s*SEC\b/gi,
  /\bSEC\b/g,
  /Ω/g,
];

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const sanitizeDynamicText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const sanitized = FORBIDDEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    value,
  );

  return normalizeWhitespace(sanitized);
};

const truncateText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const candidate = value.slice(0, maxLength - 1);
  const lastSpace = candidate.lastIndexOf(' ');
  const cutAt = lastSpace > 0 ? lastSpace : candidate.length;

  return `${candidate.slice(0, cutAt).trim()}.`;
};

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);

const formatJobContext = (job) => {
  if (typeof job === 'string') {
    return truncateText(sanitizeDynamicText(job), JOB_MAX_LENGTH);
  }

  if (!isRecord(job)) {
    return '';
  }

  const candidate = ['title', 'name', 'project', 'site', 'location', 'description']
    .map((key) => sanitizeDynamicText(job[key]))
    .find(Boolean);

  return candidate ? truncateText(candidate, JOB_MAX_LENGTH) : '';
};

const buildLinkedInCopy = (video) => {
  const jobContext = formatJobContext(video.job);
  const projectSentence = jobContext
    ? `El video muestra avances de ${jobContext}, con foco en seguridad electrica, orden de obra y continuidad operacional.`
    : 'El video muestra trabajo en terreno con foco en seguridad electrica, orden de obra y continuidad operacional.';

  return truncateText(
    [
      'Nuevo video de Magno Terra sobre puesta a tierra para proyectos electricos en Chile.',
      projectSentence,
      'Cada instalacion exige revisar terreno, alcance tecnico y documentacion antes de ejecutar.',
      'La aplicacion de RIC N06 debe evaluarse segun las condiciones y requisitos de cada proyecto.',
      `Si necesitas apoyo para tu obra o instalacion, conversemos en ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    LINKEDIN_MAX_LENGTH,
  );
};

const buildInstagramCaption = (video) => {
  const jobContext = formatJobContext(video.job);
  const context = jobContext ? ` en ${jobContext}` : '';

  return truncateText(
    [
      `Nuevo registro en terreno de Magno Terra${context}: puesta a tierra con seguridad, orden y criterio tecnico.`,
      'RIC N06 se evalua segun el alcance de cada proyecto.',
      `Escribenos en ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    INSTAGRAM_MAX_LENGTH,
  );
};

const formatVideoMarkdown = (video, index, includeHeading) => {
  const lines = [];

  if (includeHeading) {
    lines.push(`### Video ${index + 1}`, '');
  }

  lines.push(
    '1) URL',
    String(video.url).trim(),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  );

  return lines.join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = isRecord(payload) && Array.isArray(payload.videos)
    ? payload.videos.filter((video) => isRecord(video) && video.url)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  const includeHeading = videos.length > 1;

  return videos
    .map((video, index) => formatVideoMarkdown(video, index, includeHeading))
    .join('\n\n');
};

export const isYoutubeUploadBatchEvent = (payload) => (
  isRecord(payload) && payload.event === YOUTUBE_UPLOAD_BATCH_EVENT
);

export {
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
  YOUTUBE_UPLOAD_BATCH_EVENT,
};
