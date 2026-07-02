const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'sistemas de puesta a tierra';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';
const TOPIC_MAX_CHARS = 140;
const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;

const JOB_TEXT_FIELDS = [
  'title',
  'titulo',
  'topic',
  'tema',
  'name',
  'nombre',
  'description',
  'descripcion',
  'summary',
  'resumen',
];

const OMEGA_VALUE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega(?:s)?|[\u03a9\u03c9\u2126])/gi;
const SEC_CLAIM_PATTERN =
  /\b(?:cert(?:ificacion|ificado|\.?)?\s*(?:de\s*)?)?SEC\b/gi;
const RIC_N06_PATTERN = /\bRIC\s*N\s*0?6\b/gi;

const toInlineText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

const asciiFold = (value) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const trimToLimit = (value, maxChars) => {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const textFromJob = (job) => {
  if (typeof job === 'string') {
    return job;
  }

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return '';
  }

  const field = JOB_TEXT_FIELDS.find(
    (key) => typeof job[key] === 'string' && job[key].trim()
  );

  return field ? job[field] : '';
};

const sanitizeTopic = (job) => {
  const sanitized = asciiFold(toInlineText(textFromJob(job)))
    .replace(OMEGA_VALUE_PATTERN, 'valores definidos por el proyecto')
    .replace(SEC_CLAIM_PATTERN, 'documentacion tecnica aplicable')
    .replace(RIC_N06_PATTERN, 'RIC N06 segun condiciones del proyecto')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();

  return trimToLimit(sanitized || DEFAULT_TOPIC, TOPIC_MAX_CHARS);
};

const videoUrl = (video) => {
  const url = toInlineText(video?.url);

  if (url) {
    return url;
  }

  const videoId = toInlineText(video?.video_id);

  return videoId ? `${YOUTUBE_WATCH_URL}${encodeURIComponent(videoId)}` : '';
};

const buildLinkedInCopy = (topic) =>
  trimToLimit(
    [
      `Nuevo video de Magno Terra: ${topic}.`,
      'En puesta a tierra, cada proyecto requiere revisar terreno, uso, continuidad operacional y criterios tecnicos antes de definir una solucion.',
      `Si tu empresa necesita diagnostico, mantencion o mejora de su sistema, conversemos en ${CONTACT_CTA}`,
      HASHTAGS,
    ].join('\n\n'),
    LINKEDIN_MAX_CHARS
  );

const buildInstagramCaption = (topic) =>
  trimToLimit(
    [
      `Nuevo video Magno Terra: ${topic}.`,
      'Puesta a tierra con criterio tecnico para decisiones seguras en terreno.',
      `Contacto: ${CONTACT_CTA}`,
      HASHTAGS,
    ].join('\n'),
    INSTAGRAM_MAX_CHARS
  );

const markdownForVideo = (video) => {
  const url = videoUrl(video);

  if (!url) {
    return '';
  }

  const topic = sanitizeTopic(video?.job);

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(topic),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(topic),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const renderedVideos = videos
    .filter((video) => video && typeof video === 'object')
    .map(markdownForVideo)
    .filter(Boolean);

  return renderedVideos.length > 0
    ? renderedVideos.join('\n\n---\n\n')
    : 'NO_VIDEOS';
};

export const isYoutubeUploadBatchEvent = (payload = {}) =>
  payload?.event === EVENT_NAME;

export const youtubeUploadBatchLimits = {
  linkedIn: LINKEDIN_MAX_CHARS,
  instagram: INSTAGRAM_MAX_CHARS,
};
