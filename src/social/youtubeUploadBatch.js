const EMPTY_RESPONSE = 'NO_VIDEOS';
const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:\u03a9|ohm(?:s)?|omega)\b/gi,
  /\bSEC\b/gi,
  /\bcertific(?:acion|aciones|ado|ada|ados|adas|ar|a|o)?\b/gi,
];

const cleanValue = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanJobText = (value) =>
  cleanValue(value).replace(/[<>{}[\]()`*_]/g, '');

const sanitizeJob = (job) => {
  const cleaned = FORBIDDEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    cleanJobText(job)
  )
    .replace(/\s+/g, ' ')
    .trim();

  return truncate(cleaned || 'proyecto de puesta a tierra', 120);
};

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
};

const sanitizeVideoId = (videoId) =>
  cleanValue(videoId).replace(/[^A-Za-z0-9_-]/g, '');

const getVideoUrl = (video) => {
  const url = cleanValue(video?.url).replace(/[<>]/g, '');

  if (url) {
    return url;
  }

  const videoId = sanitizeVideoId(video?.video_id);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
};

const buildLinkedInCopy = (job) =>
  truncate(
    [
      `Nuevo registro en terreno: ${job}.`,
      'En Magno Terra disenamos, instalamos y mantenemos soluciones de puesta a tierra con foco en seguridad electrica, continuidad operacional y cumplimiento normativo aplicable.',
      'Cada proyecto se evalua segun su contexto; la aplicacion de RIC N06 depende del alcance, emplazamiento y requerimientos tecnicos definidos.',
      `Conversemos en ${CTA_URL}`,
      REQUIRED_HASHTAGS,
    ].join('\n\n'),
    LINKEDIN_LIMIT
  );

const buildInstagramCaption = (job) =>
  truncate(
    `Registro en terreno: ${job}. Puesta a tierra con foco tecnico y condiciones reales de proyecto. RIC N06 aplica segun alcance y requerimientos definidos. Contacto: ${CTA_URL} ${REQUIRED_HASHTAGS}`,
    INSTAGRAM_LIMIT
  );

const formatVideo = (video, index) => {
  const url = getVideoUrl(video);
  const job = sanitizeJob(video?.job);

  return [
    `### Video ${index + 1}`,
    `1) URL: ${url}`,
    `2) Copy LinkedIn empresa:\n${buildLinkedInCopy(job)}`,
    `3) Caption Instagram:\n${buildInstagramCaption(job)}`,
  ].join('\n\n');
};

export const formatYoutubeUploadBatch = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => getVideoUrl(video))
    : [];

  if (videos.length === 0) {
    return EMPTY_RESPONSE;
  }

  return videos.map(formatVideo).join('\n\n---\n\n');
};

export { EMPTY_RESPONSE, LINKEDIN_LIMIT, INSTAGRAM_LIMIT };
