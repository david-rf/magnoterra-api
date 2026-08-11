export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const removeRestrictedClaims = (value) =>
  value
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|ohmios?|omega)\b/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:\u03a9|\u2126)\b/gi, '')
    .replace(/\bcert(?:ificado|ificacion)?\s*sec\b/gi, '')
    .replace(/\bsec\b/gi, '');

const cleanText = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const compact = value
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return compact || fallback;
};

const cleanCopyContext = (value, fallback = '') => {
  const normalized = cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const compact = removeRestrictedClaims(normalized).replace(/\s+/g, ' ').trim();

  return compact || fallback;
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const buildLinkedInCopy = (job) => {
  const projectContext = truncate(cleanCopyContext(job, 'nuevo contenido tecnico'), 180);

  return [
    `Compartimos un nuevo video de Magno Terra sobre ${projectContext}.`,
    'En cada proyecto, la puesta a tierra requiere revisar condiciones del terreno, alcance de la instalacion y criterios tecnicos aplicables. La referencia a RIC N06 debe evaluarse segun el contexto especifico del proyecto.',
    `Conversemos sobre tu caso: ${CONTACT_URL}`,
    LINKEDIN_HASHTAGS,
  ].join('\n\n');
};

const buildInstagramCaption = (job) => {
  const projectContext = truncate(cleanCopyContext(job, 'puesta a tierra'), 120);

  return [
    `Nuevo video de Magno Terra: ${projectContext}.`,
    'Puesta a tierra con mirada tecnica y aplicacion responsable. RIC N06 siempre debe revisarse segun el alcance de cada proyecto.',
    CONTACT_URL,
  ].join('\n\n');
};

const formatVideo = (video, index) => {
  const videoId = cleanText(video.video_id);
  const title = videoId ? `Video ${index + 1} - ${videoId}` : `Video ${index + 1}`;
  const url = cleanText(video.url, 'URL no disponible');
  const job = cleanText(video.job);
  const linkedInCopy = buildLinkedInCopy(job);
  const instagramCaption = buildInstagramCaption(job);

  return [
    `### ${title}`,
    '1) URL',
    url,
    '2) Copy LinkedIn empresa',
    linkedInCopy,
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n\n');
};

export const buildYouTubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const validVideos = videos.filter((video) => video && typeof video === 'object');

  if (validVideos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return validVideos.map(formatVideo).join('\n\n---\n\n');
};
