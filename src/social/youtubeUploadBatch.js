const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const CONTACT_URL = 'https://magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const RIC_N06_NOTE = 'La aplicacion de RIC N06 debe evaluarse segun las condiciones de cada proyecto.';

const OMEGA_VALUE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega|[oO]hms?|[\u03a9\u2126])\b/gi;
const OMEGA_WORD_PATTERN = /\b(?:ohm(?:io)?s?|omega|[oO]hms?)\b|[\u03a9\u2126]/gi;
const SEC_PATTERN = /\b(?:cert(?:ificacion|ificado|\.?)\s*)?SEC\b/gi;
const RIC_N06_PATTERN = /\bRIC\s*N(?:o|0|\u00b0)?\s*0?6\b/gi;

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const truncateSentence = (value, limit) => {
  if (value.length <= limit) {
    return value;
  }

  const trimmed = value.slice(0, Math.max(0, limit - 1)).trimEnd();
  return `${trimmed}.`;
};

const collectText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(collectText).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    return Object.values(value).map(collectText).filter(Boolean).join(' ');
  }

  return '';
};

const sanitizeJob = (job) => {
  const rawJob = collectText(job);

  return normalizeWhitespace(rawJob
    .replace(OMEGA_VALUE_PATTERN, '')
    .replace(OMEGA_WORD_PATTERN, '')
    .replace(SEC_PATTERN, '')
    .replace(RIC_N06_PATTERN, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/(?:[,.;:]\s*){2,}/g, '. ')
    .replace(/^[-,.;:\s]+|[-,.;:\s]+$/g, ''));
};

const jobPhrase = (job, limit = 180) => {
  const sanitizedJob = sanitizeJob(job);

  if (!sanitizedJob) {
    return 'trabajo tecnico de puesta a tierra';
  }

  return truncateSentence(`trabajo tecnico de puesta a tierra: ${sanitizedJob}`, limit);
};

const buildLinkedInCopy = (job) => truncateSentence(normalizeWhitespace(`
  Nuevo video Magno Terra: ${jobPhrase(job, 220)}.
  Compartimos criterios de puesta a tierra para proyectos en Chile, con foco en seguridad,
  continuidad operacional y trazabilidad tecnica. ${RIC_N06_NOTE}
  Conversemos sobre tu proyecto: ${CONTACT_URL}
  ${REQUIRED_HASHTAGS}
`), LINKEDIN_LIMIT);

const buildInstagramCaption = (job) => truncateSentence(normalizeWhitespace(`
  Nuevo registro Magno Terra de puesta a tierra.
  ${jobPhrase(job, 150)}.
  Soluciones para proyectos en Chile, con revision tecnica caso a caso.
  RIC N06 se evalua segun el proyecto.
`), INSTAGRAM_LIMIT);

const videoMarkdown = (video) => {
  const url = normalizeWhitespace(String(video.url || ''));

  return [
    `1) URL: ${url}`,
    '',
    '2) Copy LinkedIn empresa:',
    buildLinkedInCopy(video.job),
    '',
    '3) Caption Instagram:',
    buildInstagramCaption(video.job),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && typeof video === 'object')
    : [];

  if (payload?.event && payload.event !== 'youtube_upload_batch') {
    return 'NO_VIDEOS';
  }

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(videoMarkdown).join('\n\n---\n\n');
};

export const sendYoutubeUploadBatchMarkdown = (req, res) => {
  res.type('text/markdown').send(buildYoutubeUploadBatchMarkdown(req.body));
};
