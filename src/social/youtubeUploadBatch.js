const CONTACT_CTA = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const EMPTY_RESPONSE = 'NO_VIDEOS';
const MAX_LINKEDIN_LENGTH = 900;
const MAX_INSTAGRAM_LENGTH = 500;

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:omega|ohm|ohms|\u03a9|\u03c9)\b/gi,
  /\b(?:omega|ohm|ohms|\u03a9|\u03c9)\b/gi,
  /\b(?:cert(?:\.|ificacion|ificaci\u00f3n)?|certificado|certificacion|certificaci\u00f3n)\s+SEC\b/gi,
  /\bSEC\s+(?:cert(?:\.|ificacion|ificaci\u00f3n)?|certificado|certificacion|certificaci\u00f3n)\b/gi,
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

const trimWithRequiredSuffix = (body, suffix, maxLength) => {
  const cleanBody = collapseWhitespace(body);
  const copy = `${cleanBody} ${suffix}`;

  if (copy.length <= maxLength) {
    return copy;
  }

  const availableBodyLength = maxLength - suffix.length - 1;
  return `${trimToLength(cleanBody, availableBodyLength)} ${suffix}`;
};

const describeJob = (job, maxLength) => trimToLength(sanitizeText(job), maxLength);

const buildLinkedInCopy = (video) => {
  const job = describeJob(video.job, 160);
  const jobContext = job ? `Proyecto: ${job}. ` : '';
  const body = `${jobContext}En Magno Terra compartimos este registro para mostrar nuestro enfoque en soluciones de puesta a tierra ejecutadas con criterio tecnico, seguridad y coordinacion en terreno. Cada proyecto requiere evaluar condiciones del sitio, alcance y normativa aplicable; RIC N06 se revisa segun corresponda al proyecto. Si necesitas apoyo para diagnostico, suministro o ejecucion, conversemos en ${CONTACT_CTA}.`;

  return trimWithRequiredSuffix(body, REQUIRED_HASHTAGS, MAX_LINKEDIN_LENGTH);
};

const buildInstagramCaption = (video) => {
  const job = describeJob(video.job, 120);
  const jobContext = job ? `${job}: ` : '';
  const caption = `${jobContext}Puesta a tierra con foco tecnico y ejecucion segura en terreno. Cada solucion se define segun las condiciones del proyecto. Contactanos en ${CONTACT_CTA}.`;

  return trimToLength(caption, MAX_INSTAGRAM_LENGTH);
};

const normalizeVideos = (payload = {}) => {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos
    .filter((video) => video && typeof video === 'object')
    .map((video) => ({
      video_id: sanitizeText(video.video_id),
      url: collapseWhitespace(video.url),
      job: sanitizeText(video.job),
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

const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = normalizeVideos(payload);

  if (videos.length === 0) {
    return EMPTY_RESPONSE;
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export {
  CONTACT_CTA,
  EMPTY_RESPONSE,
  MAX_INSTAGRAM_LENGTH,
  MAX_LINKEDIN_LENGTH,
  REQUIRED_HASHTAGS,
  buildInstagramCaption,
  buildLinkedInCopy,
  buildYoutubeUploadBatchMarkdown,
};
