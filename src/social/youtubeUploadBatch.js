const LINKEDIN_MAX_CHARS = 900;
const INSTAGRAM_MAX_CHARS = 500;
const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const RESTRICTED_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:omega|ohmios?|ohms?|Ω)\b/gi,
  /\b(?:omega|ohmios?|ohms?)\b/gi,
  /Ω/gi,
  /\b(?:cert(?:\.|ificacion|ificación)?\s*)?SEC\b/gi,
];

const cleanText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/\s+/g, ' ').trim();
};

const stripRestrictedTerms = (value) => {
  let cleanValue = cleanText(value);

  for (const pattern of RESTRICTED_PATTERNS) {
    cleanValue = cleanValue.replace(pattern, '');
  }

  return cleanText(cleanValue.replace(/\s+([,.;:])/g, '$1'));
};

const truncateAtWord = (value, maxLength) => {
  const cleanValue = cleanText(value);

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  const truncated = cleanValue.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength - 1).trim()}…`;
};

const getVideoUrl = (video) => {
  const explicitUrl = cleanText(video?.url);
  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = cleanText(video?.video_id);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

const getProjectContext = (video, maxLength = 120) => {
  const job = truncateAtWord(stripRestrictedTerms(video?.job), maxLength);
  return job ? ` sobre ${job}` : '';
};

const buildLinkedInCopy = (video) => {
  const projectContext = getProjectContext(video);

  return truncateAtWord(
    `Compartimos una nueva capsula de Magno Terra${projectContext}: criterios practicos para disenar, ejecutar y revisar soluciones de puesta a tierra con foco en seguridad, continuidad operacional y documentacion clara. La aplicacion de RIC N06 debe evaluarse segun el alcance y las condiciones de cada proyecto. Necesitas apoyo tecnico? Conversemos en ${CONTACT_CTA}\n\n${REQUIRED_HASHTAGS}`,
    LINKEDIN_MAX_CHARS,
  );
};

const buildInstagramCaption = (video) => {
  const projectContext = getProjectContext(video, 80);

  return truncateAtWord(
    `Nueva capsula de Magno Terra${projectContext}: puesta a tierra con criterio tecnico, seguridad y documentacion clara. RIC N06 aplica segun el alcance de cada proyecto. Contacto: ${CONTACT_CTA}`,
    INSTAGRAM_MAX_CHARS,
  );
};

const formatVideoMarkdown = (video, index) => {
  const url = getVideoUrl(video);
  const linkedInCopy = buildLinkedInCopy(video);
  const instagramCaption = buildInstagramCaption(video);

  return [
    `## Video ${index + 1}`,
    '',
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    linkedInCopy,
    '',
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n');
};

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos.filter(Boolean) : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video, index) => formatVideoMarkdown(video, index)).join('\n\n---\n\n');
};

export const youtubeUploadBatchWebhookHandler = (req, res) => {
  const markdown = formatYoutubeUploadBatchMarkdown(req.body);

  res.status(200).type('text/markdown; charset=utf-8').send(markdown);
};
