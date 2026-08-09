const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';

const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const JOB_MAX_LENGTH = 90;

const FORBIDDEN_DYNAMIC_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:\u03a9|\u03c9|omega\b|ohms?\b|ohmios?\b)/gi,
  /\b(?:cert(?:ificaci(?:o|\u00f3)n)?|certificado|cert\.?)\s+SEC\b/gi,
  /\bSEC\b/gi,
  /[\u03a9\u03c9]/g,
];

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const sanitizeInline = (value) =>
  normalizeWhitespace(String(value ?? '').replace(/[\r\n<>]/g, ' '));

const trimDanglingConnectors = (value) => {
  let current = value.trim();

  while (/\b(?:con|y|de|del|para|en)\s*$/i.test(current)) {
    current = current.replace(/\b(?:con|y|de|del|para|en)\s*$/i, '').trim();
  }

  return current;
};

const sanitizeDynamicText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const sanitized = FORBIDDEN_DYNAMIC_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    value
  );

  return trimDanglingConnectors(normalizeWhitespace(sanitized));
};

const truncateText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  const end = lastSpace > 0 ? lastSpace : truncated.length;

  return `${truncated.slice(0, end).trimEnd()}.`;
};

const formatJobContext = (job) => {
  if (typeof job === 'string') {
    return truncateText(sanitizeDynamicText(job), JOB_MAX_LENGTH);
  }

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return '';
  }

  const candidate = [
    'title',
    'name',
    'project',
    'site',
    'location',
    'description',
  ]
    .map((key) => sanitizeDynamicText(job[key]))
    .find(Boolean);

  return candidate ? truncateText(candidate, JOB_MAX_LENGTH) : '';
};

const videoUrlFrom = (video) => {
  const explicitUrl = sanitizeInline(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = sanitizeInline(video?.video_id);

  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
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
      'RIC N06 se evalua segun las condiciones y requisitos de cada proyecto.',
      `Si necesitas apoyo para tu obra o instalacion, conversemos en ${CONTACT_CTA}`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    LINKEDIN_MAX_LENGTH
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
    ].join(' '),
    INSTAGRAM_MAX_LENGTH
  );
};

const isRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value);

const formatVideoMarkdown = (video) =>
  [
    '1) URL',
    video.url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  ].join('\n');

export const getYoutubeUploadVideos = (payload) => {
  if (
    !isRecord(payload) ||
    payload.event !== YOUTUBE_UPLOAD_BATCH_EVENT ||
    !Array.isArray(payload.videos)
  ) {
    return [];
  }

  return payload.videos
    .filter(isRecord)
    .map((video) => ({
      ...video,
      url: videoUrlFrom(video),
    }))
    .filter((video) => video.url);
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getYoutubeUploadVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n');
};

export const sendYoutubeUploadBatchMarkdown = (req, res) => {
  res.type('text/markdown').send(buildYoutubeUploadBatchMarkdown(req.body));
};

export {
  CONTACT_CTA,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
  YOUTUBE_UPLOAD_BATCH_EVENT,
};
