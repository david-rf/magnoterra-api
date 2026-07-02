const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const CONTACT_CTA = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const NO_VIDEOS = 'NO_VIDEOS';

const OMEGA_VALUE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:ohms?|ohmios?|omega|omegas|[\u03a9\u2126])\b/gi;
const SEC_CERT_PATTERN =
  /\b(?:cert(?:\.|ificado|ificacion)?\s*(?:sec)|sec\s*cert(?:\.|ificado|ificacion)?)\b/gi;
const RIC_N06_PATTERN = /\bric\s*n(?:[\u00b0\u00ba]|ro\.?|umero)?\s*0?6\b/gi;

const singleLine = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const cleanMarketingText = (value) =>
  singleLine(value)
    .replace(OMEGA_VALUE_PATTERN, 'valores de resistencia')
    .replace(SEC_CERT_PATTERN, 'documentacion tecnica')
    .replace(
      RIC_N06_PATTERN,
      'criterios RIC N06 cuando corresponda al proyecto'
    )
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value, limit) => {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
};

const truncateForSentence = (value, limit) =>
  truncate(cleanMarketingText(value), limit).replace(/[.,;:]+$/, '');

const fitWithRequiredSuffix = (body, suffix, limit) => {
  const separator = body ? ' ' : '';
  const availableBodyLength = limit - suffix.length - separator.length;

  if (availableBodyLength <= 0) {
    return truncate(suffix, limit);
  }

  return `${truncate(body, availableBodyLength)}${separator}${suffix}`;
};

const getVideoUrl = (video) => {
  const url = singleLine(video?.url);

  if (url) {
    return url;
  }

  const videoId = singleLine(video?.video_id);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
};

const getJobDescription = (video, limit) => {
  const job = truncateForSentence(video?.job, limit);

  return job || 'nuevo registro tecnico en terreno';
};

export const buildLinkedInCopy = (video) => {
  const job = getJobDescription(video, 160);
  const body =
    `En Magno Terra compartimos un nuevo registro de nuestro trabajo en puesta a tierra: ${job}. ` +
    'Cada proyecto se aborda con diagnostico, diseno responsable y ejecucion coordinada para proteger personas, equipos y continuidad operacional. ' +
    'Revisamos condiciones del terreno y requerimientos aplicables, incluyendo criterios RIC N06 cuando corresponda al proyecto. ' +
    `Necesitas evaluar tu instalacion? Conversemos en ${CONTACT_CTA}`;

  return fitWithRequiredSuffix(body, HASHTAGS, LINKEDIN_LIMIT);
};

export const buildInstagramCaption = (video) => {
  const job = getJobDescription(video, 100);
  const caption =
    `Nuevo video de Magno Terra: ${job}. ` +
    'Puesta a tierra con foco en seguridad, continuidad operacional y ejecucion responsable. ' +
    `Agenda una evaluacion en ${CONTACT_CTA} ${HASHTAGS}`;

  return truncate(caption, INSTAGRAM_LIMIT);
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (!Array.isArray(payload?.videos) || payload.videos.length === 0) {
    return NO_VIDEOS;
  }

  return payload.videos
    .map((video, index) => {
      const number = index + 1;

      return [
        `## Video ${number}`,
        '',
        `1. URL: ${getVideoUrl(video)}`,
        `2. Copy LinkedIn empresa: ${buildLinkedInCopy(video)}`,
        `3. Caption Instagram: ${buildInstagramCaption(video)}`,
      ].join('\n');
    })
    .join('\n\n');
};

export { LINKEDIN_LIMIT, INSTAGRAM_LIMIT, NO_VIDEOS };
