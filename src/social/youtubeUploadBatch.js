const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const NO_VIDEOS = 'NO_VIDEOS';

const FORBIDDEN_COPY_PATTERNS = [
  /\bcert(?:\.|ificacion|ificado)?\s+SEC\b/gi,
  /\bSEC\b/gi,
  /\b\d+(?:[.,]\d+)?\s*(?:ohmios?|ohms?|omega|[ΩΩ])\b/gi,
  /[ΩΩ]/g,
  /\bomega\b/gi,
  /\bohmios?\b/gi,
  /\bohms?\b/gi,
];

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const stripForbiddenClaims = (value) => {
  let sanitized = normalizeWhitespace(value);

  for (const pattern of FORBIDDEN_COPY_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return normalizeWhitespace(sanitized);
};

const sanitizeMarkdownText = (value) => (
  stripForbiddenClaims(value)
    .replace(/[`*_#[\]()<>|]/g, '')
    .slice(0, 140)
    .trim()
);

const getJobLabel = (job) => {
  if (typeof job === 'string') {
    return sanitizeMarkdownText(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const fields = ['title', 'name', 'project', 'site', 'type', 'description'];
  const value = fields.map((field) => job[field]).find(Boolean);

  return sanitizeMarkdownText(value);
};

const getVideoUrl = (video) => {
  const explicitUrl = normalizeWhitespace(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = normalizeWhitespace(video?.video_id);

  if (!videoId) {
    return '';
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
};

const clampCopy = (value, limit) => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3).trimEnd()}...`;
};

const buildLinkedInCopy = (video) => {
  const jobLabel = getJobLabel(video.job);
  const subject = jobLabel || 'un nuevo video tecnico de puesta a tierra';

  return clampCopy([
    `Compartimos ${subject} para mostrar como una puesta a tierra bien planificada ayuda a cuidar personas, continuidad operacional e infraestructura.`,
    'En MagnoTerra abordamos cada levantamiento con criterio tecnico: RIC N06 se evalua segun las condiciones de cada proyecto, terreno y alcance.',
    `Conversemos sobre tu instalacion: ${CONTACT_URL}`,
    HASHTAGS,
  ].join('\n\n'), LINKEDIN_LIMIT);
};

const buildInstagramCaption = (video) => {
  const jobLabel = getJobLabel(video.job);
  const subject = jobLabel || 'nuevo video tecnico';

  return clampCopy(
    `Nuevo video de MagnoTerra: ${subject}. Una buena puesta a tierra parte con diagnostico, terreno y criterio tecnico. RIC N06 se revisa segun cada proyecto. Contacto en ${CONTACT_URL}.`,
    INSTAGRAM_LIMIT,
  );
};

const renderVideoMarkdown = (video, index) => {
  const url = getVideoUrl(video);

  return [
    `## Video ${index + 1}`,
    '',
    `1) URL: ${url}`,
    '',
    '2) Copy LinkedIn empresa:',
    '',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram:',
    '',
    buildInstagramCaption(video),
  ].join('\n');
};

export const renderYouTubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const renderableVideos = videos.filter((video) => getVideoUrl(video));

  if (renderableVideos.length === 0) {
    return NO_VIDEOS;
  }

  return renderableVideos.map(renderVideoMarkdown).join('\n\n---\n\n');
};

export {
  CONTACT_URL,
  HASHTAGS,
  INSTAGRAM_LIMIT,
  LINKEDIN_LIMIT,
  NO_VIDEOS,
};
