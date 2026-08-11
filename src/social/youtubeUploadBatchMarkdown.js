const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const emptyMarkdown = 'NO_VIDEOS';

function cleanText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function stripRestrictedClaims(value) {
  return cleanText(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:s|ios)?|omega|Ω)\b/gi, '')
    .replace(/\b(?:cert(?:ificacion|ificación)?|certificado|certificada|certificados|certificadas)\s+(?:por\s+)?SEC\b/gi, '')
    .replace(/\bSEC\b/gi, '')
    .replace(/\b(?:cumple|cumplimiento|garantizado|garantizada|certificado|certificada)\s+(?:con\s+)?RIC\s*N\s*0?6\b/gi, '')
    .replace(/\b(?:garantizado|garantizada|garantizados|garantizadas)\b/gi, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveVideoUrl(video) {
  const explicitUrl = cleanText(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = cleanText(video?.video_id);

  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return 'URL no disponible';
}

function sentenceFromJob(job) {
  const safeJob = stripRestrictedClaims(job);

  if (!safeJob) {
    return 'compartimos criterios practicos para proyectos de puesta a tierra';
  }

  return `compartimos ${safeJob}`;
}

function trimToLimit(value, limit) {
  const text = cleanText(value);

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 3).trimEnd()}...`;
}

function buildLinkedInCopy(video) {
  const body = [
    `Nuevo video de Magno Terra: ${sentenceFromJob(video?.job)}.`,
    'Mostramos criterios practicos para revisar, ejecutar y mantener soluciones de puesta a tierra con foco en seguridad operacional y continuidad del servicio.',
    'Cada terreno y alcance requiere evaluacion tecnica; la aplicacion de RIC N06 se confirma segun el proyecto.',
    `Conversemos sobre tu instalacion en ${CONTACT_URL}`,
    LINKEDIN_HASHTAGS,
  ].join(' ');

  return trimToLimit(body, LINKEDIN_LIMIT);
}

function buildInstagramCaption(video) {
  const body = [
    `Nuevo video: ${sentenceFromJob(video?.job)}.`,
    'Puesta a tierra con criterio tecnico para proyectos en Chile.',
    'Cada caso se evalua segun su alcance.',
    `Contacto: ${CONTACT_URL}`,
  ].join(' ');

  return trimToLimit(body, INSTAGRAM_LIMIT);
}

function buildVideoMarkdown(video, index) {
  return [
    `### Video ${index + 1}`,
    '',
    `1) URL: ${resolveVideoUrl(video)}`,
    '2) Copy LinkedIn empresa:',
    buildLinkedInCopy(video),
    '3) Caption Instagram:',
    buildInstagramCaption(video),
  ].join('\n');
}

export function buildYoutubeUploadBatchMarkdown(payload) {
  if (!payload || !Array.isArray(payload.videos) || payload.videos.length === 0) {
    return emptyMarkdown;
  }

  return payload.videos.map(buildVideoMarkdown).join('\n\n---\n\n');
}

export { CONTACT_URL, LINKEDIN_HASHTAGS, LINKEDIN_LIMIT, INSTAGRAM_LIMIT };
