const CONTACT_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'puesta a tierra y evaluacion tecnica en terreno';

const OMEGA_MEASUREMENT_PATTERN =
  /\b(?:menor(?:es)?\s+a|menor(?:es)?\s+que|inferior(?:es)?\s+a|bajo|<=?|\u2264)?\s*\d+(?:[.,]\d+)?\s*(?:(?:ohm(?:s|ios?)?|omega)\b|[\u03a9\u2126\u03c9])/gi;
const SEC_CLAIM_PATTERN =
  /\b(?:certificad[oa]s?|certificaci[o\u00f3]n|acreditad[oa]s?|aprobaci[o\u00f3]n|aprobado|autorizad[oa]s?)\s+(?:por\s+)?SEC\b/gi;
const RIC_N06_PATTERN = /\bRIC\s*N(?:\.|ro\.?|\u00ba|\u00b0)?\s*0?6\b/gi;

const safeString = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

const firstUsefulJobText = (job) => {
  if (typeof job === 'string') {
    return job;
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const keys = [
    'title',
    'name',
    'description',
    'service',
    'project',
    'summary',
  ];
  const found = keys
    .map((key) => job[key])
    .find((value) => typeof value === 'string' && value.trim());

  return found || '';
};

const stripMarkdownNoise = (value) =>
  value
    .replace(/[`*_#[\]()>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const truncateText = (value, maxLength) => {
  const text = safeString(value).trim();

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');

  return `${truncated.slice(0, lastSpace > 40 ? lastSpace : truncated.length)}...`;
};

export const sanitizeJobText = (job) => {
  const sanitized = stripMarkdownNoise(firstUsefulJobText(job))
    .replace(OMEGA_MEASUREMENT_PATTERN, '')
    .replace(SEC_CLAIM_PATTERN, '')
    .replace(/\bSEC\b/gi, '')
    .replace(RIC_N06_PATTERN, 'normativa aplicable segun el proyecto')
    .replace(/\s+/g, ' ')
    .trim();

  return truncateText(sanitized || DEFAULT_TOPIC, 140);
};

export const buildLinkedInCopy = (job) =>
  truncateText(
    [
      `Nuevo video de Magno Terra: ${sanitizeJobText(job)}.`,
      'En puesta a tierra, cada obra requiere revisar terreno, uso, normativa aplicable y condiciones de instalacion antes de definir una solucion.',
      `Si tu proyecto necesita una evaluacion tecnica responsable, conversemos en ${CONTACT_URL}.`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    900
  );

export const buildInstagramCaption = (job) =>
  truncateText(
    [
      `Nuevo video: ${sanitizeJobText(job)}.`,
      'Puesta a tierra con criterio tecnico para cada proyecto en Chile.',
      `Contacto: ${CONTACT_URL}`,
      REQUIRED_HASHTAGS,
    ].join(' '),
    500
  );

export const formatVideoMarkdown = (video) => {
  const url = safeString(video?.url).trim() || 'NO_URL';

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video?.job),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video?.job),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (
    !payload ||
    !Array.isArray(payload.videos) ||
    payload.videos.length === 0
  ) {
    return 'NO_VIDEOS';
  }

  const videos = payload.videos.filter(
    (video) => video && typeof video === 'object'
  );

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};
