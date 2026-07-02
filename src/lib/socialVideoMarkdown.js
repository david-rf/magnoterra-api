const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const JOB_MAX_LENGTH = 80;

const FORBIDDEN_DYNAMIC_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:Ω|omega|ohms?|ohmios?)\b/gi,
  /\b(?:cert(?:ificacion|ificación)?|cert\.?)\s*SEC\b/gi,
  /\bSEC\b/gi,
  /Ω/g,
];

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const sanitizeDynamicText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const sanitized = FORBIDDEN_DYNAMIC_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    value,
  );

  return normalizeWhitespace(sanitized);
};

const truncateSentence = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length).trim()}.`;
};

const formatJobContext = (job) => {
  if (typeof job === 'string') {
    return truncateSentence(sanitizeDynamicText(job), JOB_MAX_LENGTH);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const candidate = ['title', 'name', 'project', 'site', 'location', 'description']
    .map((key) => sanitizeDynamicText(job[key]))
    .find(Boolean);

  return candidate ? truncateSentence(candidate, JOB_MAX_LENGTH) : '';
};

const buildLinkedInCopy = (video) => {
  const jobContext = formatJobContext(video.job);
  const projectSentence = jobContext
    ? `El video muestra avances de ${jobContext}, con foco en seguridad electrica, orden de obra y continuidad operacional.`
    : 'El video muestra trabajo en terreno con foco en seguridad electrica, orden de obra y continuidad operacional.';

  return truncateSentence(
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

  return truncateSentence(
    [
      `Nuevo registro en terreno de Magno Terra${context}: puesta a tierra con seguridad, orden y criterio tecnico.`,
      'RIC N06 se evalua segun el alcance de cada proyecto.',
      `Escribenos en ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    INSTAGRAM_MAX_LENGTH,
  );
};

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);

const formatVideoMarkdown = (video) => (
  [
    '1) URL',
    String(video.url).trim(),
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  ].join('\n')
);

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = isRecord(payload) && Array.isArray(payload.videos)
    ? payload.videos.filter((video) => isRecord(video) && video.url)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => formatVideoMarkdown(video))
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
