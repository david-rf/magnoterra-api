const EVENT_NAME = 'youtube_upload_batch';
const CTA_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const FALLBACK_JOB = 'Nuevo video tecnico de Magno Terra';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega|Ω)\b/gi,
  /\b(?:ohm(?:io)?s?|omega|Ω)\s*\d+(?:[.,]\d+)?\b/gi,
  /Ω/gi,
  /\b(?:cert(?:ificacion|ificado)?\.?\s*)?SEC\b/gi,
];

const collectPrimitiveValues = (value) => {
  if (value === null || value === undefined) {
    return [];
  }

  if (['string', 'number', 'boolean'].includes(typeof value)) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectPrimitiveValues);
  }

  if (typeof value === 'object') {
    return Object.values(value).flatMap(collectPrimitiveValues);
  }

  return [];
};

const sanitizeText = (value) => {
  const rawText = collectPrimitiveValues(value).join(' ');
  const withoutForbiddenTerms = FORBIDDEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    rawText
  );

  return withoutForbiddenTerms
    .replace(/[{}[\]"'`]/g, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncatePreservingWords = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = clipped.lastIndexOf(' ');

  return `${(lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
};

const getJobSummary = (job) => {
  const sanitizedJob = sanitizeText(job);
  return truncatePreservingWords(sanitizedJob || FALLBACK_JOB, 160);
};

const getVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return 'URL no disponible';
};

const buildLinkedInCopy = (jobSummary) => {
  const suffix = `\n\nConversemos: ${CTA_URL}\n\n${HASHTAGS}`;
  const body = [
    `Nuevo registro tecnico de Magno Terra: ${jobSummary}.`,
    'En puesta a tierra, cada instalacion requiere diagnostico, diseno y ejecucion acordes a las condiciones del terreno, la operacion y el alcance definido.',
    'La referencia RIC N06 queda condicionada al alcance y condiciones del proyecto.',
  ].join(' ');

  return `${truncatePreservingWords(body, MAX_LINKEDIN_CHARS - suffix.length)}${suffix}`;
};

const buildInstagramCaption = (jobSummary) => {
  const suffix = `\n\nMas informacion: ${CTA_URL}`;
  const body = [
    `${jobSummary}.`,
    'Puesta a tierra con criterio tecnico y soluciones ajustadas a cada proyecto.',
    'RIC N06 queda condicionado al alcance y condiciones del proyecto.',
  ].join(' ');

  return `${truncatePreservingWords(body, MAX_INSTAGRAM_CHARS - suffix.length)}${suffix}`;
};

const isVideoCandidate = (video) =>
  video &&
  typeof video === 'object' &&
  (typeof video.url === 'string' || typeof video.video_id === 'string' || video.job !== undefined);

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (payload?.event !== EVENT_NAME || !Array.isArray(payload?.videos)) {
    return 'NO_VIDEOS';
  }

  const videos = payload.videos.filter(isVideoCandidate);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video) => {
      const jobSummary = getJobSummary(video.job);

      return [
        `1) URL: ${getVideoUrl(video)}`,
        '2) Copy LinkedIn empresa:',
        buildLinkedInCopy(jobSummary),
        '3) Caption Instagram:',
        buildInstagramCaption(jobSummary),
      ].join('\n\n');
    })
    .join('\n\n---\n\n');
};

export { MAX_INSTAGRAM_CHARS, MAX_LINKEDIN_CHARS };
