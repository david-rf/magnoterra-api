const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const EMPTY_RESPONSE = 'NO_VIDEOS';

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:omega|ohm|ohms|Ω)\b/gi,
  /\b(?:cert(?:\.|ificacion|ificación)?|certificado|certificacion|certificación)\s+SEC\b/gi,
  /\bSEC\s+(?:cert(?:\.|ificacion|ificación)?|certificado|certificacion|certificación)\b/gi,
];

const collapseWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const sanitizeText = (value) => {
  let sanitized = collapseWhitespace(value);

  for (const pattern of FORBIDDEN_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return collapseWhitespace(sanitized);
};

const trimToLength = (value, maxLength) => {
  const cleanValue = collapseWhitespace(value);

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  const truncated = cleanValue.slice(0, maxLength).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');

  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
};

const describeJob = (job) => {
  const cleanJob = trimToLength(sanitizeText(job), 160);

  return cleanJob ? `Proyecto: ${cleanJob}. ` : '';
};

const buildLinkedInCopy = (video) => {
  const jobContext = describeJob(video.job);
  const copy = `${jobContext}En Magno Terra compartimos este registro para mostrar nuestro enfoque en soluciones de puesta a tierra ejecutadas con criterio tecnico, seguridad y coordinacion en terreno. Cada proyecto requiere evaluar condiciones del sitio, alcance y normativa aplicable; RIC N06 se revisa segun corresponda al proyecto. Si necesitas apoyo para diagnostico, suministro o ejecucion, conversemos en ${CONTACT_CTA}. ${REQUIRED_HASHTAGS}`;

  return trimToLength(copy, 900);
};

const buildInstagramCaption = (video) => {
  const cleanJob = trimToLength(sanitizeText(video.job), 120);
  const jobContext = cleanJob ? `${cleanJob}: ` : '';
  const caption = `${jobContext}Puesta a tierra con foco tecnico y ejecucion segura en terreno. Cada solucion se define segun las condiciones del proyecto. Contactanos en ${CONTACT_CTA}.`;

  return trimToLength(caption, 500);
};

const normalizeVideos = (payload = {}) => {
  if (!Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos
    .map((video) => ({
      video_id: sanitizeText(video?.video_id),
      url: collapseWhitespace(video?.url),
      job: sanitizeText(video?.job),
    }))
    .filter((video) => video.url);
};

const formatVideoMarkdown = (video) =>
  [
    '1) URL',
    video.url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video),
  ].join('\n');

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = normalizeVideos(payload);

  if (videos.length === 0) {
    return EMPTY_RESPONSE;
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export {
  CONTACT_CTA,
  EMPTY_RESPONSE,
  REQUIRED_HASHTAGS,
  buildInstagramCaption,
  buildLinkedInCopy,
};
