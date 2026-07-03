const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const DISALLOWED_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:(?:ohm(?:io)?s?|omega)\b|[\u03a9\u2126])/gi,
  /\b(?:SEC|cert(?:ificado|ificacion|ificaciones)?(?:\s+SEC)?)\b/gi,
];

const normalizeText = (value) => String(value || '')
  .replace(/[\r\n]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sanitizeJob = (job) => {
  let sanitized = normalizeText(job);

  DISALLOWED_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.replace(/\s+/g, ' ').trim();
};

const limitText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const hardLimit = maxLength - 3;
  const truncated = text.slice(0, hardLimit);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeCut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;

  return `${safeCut.trim()}...`;
};

const getJobLine = (job) => {
  const sanitizedJob = sanitizeJob(job);

  return sanitizedJob ? `Trabajo asociado: ${sanitizedJob}. ` : '';
};

const buildLinkedInCopy = (video) => limitText(
  [
    'Nuevo video Magno Terra: compartimos una mirada tecnica sobre puesta a tierra para proyectos en Chile.',
    `${getJobLine(video.job)}Cada obra se revisa segun terreno, alcance y requisitos aplicables; RIC N06 queda condicionado al proyecto y a su ingenieria.`,
    `Si necesitas evaluar, mejorar o mantener tu sistema de puesta a tierra, conversemos: ${CTA_URL}`,
    REQUIRED_HASHTAGS,
  ].join('\n\n'),
  LINKEDIN_MAX_LENGTH,
);

const buildInstagramCaption = (video) => limitText(
  [
    'Nuevo video en el canal: puesta a tierra con foco tecnico y ejecucion en terreno.',
    `${getJobLine(video.job)}RIC N06 condicionado al proyecto.`,
    REQUIRED_HASHTAGS,
  ].join(' '),
  INSTAGRAM_MAX_LENGTH,
);

const isRenderableVideo = (video) => video && normalizeText(video.url);

const buildVideoMarkdown = (video, index) => [
  `### Video ${index + 1}`,
  '',
  '1) URL',
  normalizeText(video.url),
  '',
  '2) Copy LinkedIn empresa',
  buildLinkedInCopy(video),
  '',
  '3) Caption Instagram',
  buildInstagramCaption(video),
].join('\n');

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload.videos)
    ? payload.videos.filter(isRenderableVideo)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(buildVideoMarkdown).join('\n\n---\n\n');
};

export {
  LINKEDIN_MAX_LENGTH,
  INSTAGRAM_MAX_LENGTH,
  CTA_URL,
  REQUIRED_HASHTAGS,
};
