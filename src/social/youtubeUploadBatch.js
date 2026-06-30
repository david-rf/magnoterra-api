const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const TOPIC_LIMIT = 160;
const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const FALLBACK_TOPIC = 'Soluciones de puesta a tierra';

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:ohmios?|ohms?|omega)\b/gi,
  /\b(?:ohmios?|ohms?|omega)\b/gi,
  /[\u03a9\u03c9]/g,
  /\b(?:cert(?:\.|ificacion|ificado)?\s*)?SEC\b/gi,
  /\bRIC\s*N[\u00b0\u00bao.]?\s*0?6\b/gi,
];

function cleanWhitespace(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/([,.;:]){2,}/g, '$1')
    .replace(/\b(?:con|para|de|en|y)\s*[.,;:]*$/i, '')
    .trim();
}

function stripForbiddenTerms(value) {
  return FORBIDDEN_PATTERNS.reduce(
    (currentValue, pattern) => currentValue.replace(pattern, ''),
    value,
  );
}

function limitText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  const omission = '...';
  const truncated = value.slice(0, maxLength - omission.length);
  const lastSpace = truncated.lastIndexOf(' ');
  const safeCut = lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated;

  return `${safeCut.trimEnd()}${omission}`;
}

export function normalizeVideoTopic(job) {
  if (typeof job !== 'string') {
    return FALLBACK_TOPIC;
  }

  const topic = limitText(cleanWhitespace(stripForbiddenTerms(job)), TOPIC_LIMIT);

  return topic || FALLBACK_TOPIC;
}

export function buildLinkedInCopy(video) {
  const topic = normalizeVideoTopic(video?.job);
  const copy = [
    `Nuevo video Magno Terra: ${topic}.`,
    '',
    'En Magno Terra acompanamos a empresas, obras e industrias con soluciones de puesta a tierra pensadas para seguridad operacional, continuidad y cumplimiento normativo segun las condiciones de cada proyecto.',
    '',
    `Conversemos sobre tu necesidad: ${CTA_URL}`,
    '',
    REQUIRED_HASHTAGS,
  ].join('\n');

  return limitText(copy, LINKEDIN_LIMIT);
}

export function buildInstagramCaption(video) {
  const topic = normalizeVideoTopic(video?.job);
  const caption = `${topic}. Puesta a tierra para proyectos que necesitan seguridad, continuidad y una ejecucion responsable. Hablemos: ${CTA_URL} ${REQUIRED_HASHTAGS}`;

  return limitText(caption, INSTAGRAM_LIMIT);
}

function isValidVideo(video) {
  return video && typeof video.url === 'string' && video.url.trim().length > 0;
}

export function buildYoutubeUploadBatchMarkdown(payload) {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter(isValidVideo)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) => [
      `## Video ${index + 1}`,
      '',
      `1) URL: ${video.url.trim()}`,
      '2) Copy LinkedIn empresa:',
      buildLinkedInCopy(video),
      '',
      '3) Caption Instagram:',
      buildInstagramCaption(video),
    ].join('\n'))
    .join('\n\n---\n\n');
}
