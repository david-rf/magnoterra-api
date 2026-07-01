const CONTACT_CTA = 'Conversemos en magnoterra.cl/contacto.';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'nuevo contenido tecnico de Magno Terra';

const FIELD_PRIORITY = [
  'title',
  'name',
  'topic',
  'service',
  'description',
  'summary',
  'slug',
];

const normalizeWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const truncateAtWord = (value, maxLength) => {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength - 1).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  const truncated = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;

  return `${truncated.replace(/[.,;:!?-]+$/, '')}...`;
};

const sanitizeRestrictedClaims = (value) => {
  const withoutTechnicalFigures = normalizeWhitespace(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega?s?)\b/gi, 'resultados tecnicos del proyecto')
    .replace(/\bcert(?:ificacion|ificado|\.?)?\s*SEC\b/gi, 'validacion normativa')
    .replace(/\bSEC\b/g, 'normativa aplicable')
    .replace(/\bRIC\s*N\s*0?6\b/gi, 'RIC N06 sujeto a los requisitos del proyecto')
    .replace(/\bRICN0?6\b/gi, 'RIC N06 sujeto a los requisitos del proyecto');

  return truncateAtWord(withoutTechnicalFigures, 180) || DEFAULT_TOPIC;
};

const extractTopicFromJob = (job) => {
  if (typeof job === 'string' || typeof job === 'number') {
    return job;
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const field = FIELD_PRIORITY.find((key) => job[key]);

  if (!field) {
    return '';
  }

  return job[field];
};

const buildLinkedInCopy = (topic) => {
  const copy = [
    `Nuevo video Magno Terra: ${topic}.`,
    'Compartimos contenido practico sobre puesta a tierra, mantenimiento preventivo y decisiones tecnicas para proyectos electricos en Chile.',
    'Cada solucion debe revisarse segun las condiciones del terreno, el alcance y la normativa aplicable; RIC N06 aplica cuando el proyecto lo requiere.',
    CONTACT_CTA,
    LINKEDIN_HASHTAGS,
  ].join(' ');

  return truncateAtWord(copy, 900);
};

const buildInstagramCaption = (topic) => {
  const caption = [
    `${topic}.`,
    'Una mirada practica para cuidar proyectos electricos y sistemas de puesta a tierra en Chile.',
    'Agenda tu consulta en magnoterra.cl/contacto.',
  ].join(' ');

  return truncateAtWord(caption, 500);
};

const formatVideoMarkdown = (video, index) => {
  const topic = sanitizeRestrictedClaims(extractTopicFromJob(video?.job));
  const url = normalizeWhitespace(video?.url) || 'URL no disponible';
  const linkedInCopy = buildLinkedInCopy(topic);
  const instagramCaption = buildInstagramCaption(topic);

  return [
    `### Video ${index + 1}`,
    `1) URL: ${url}`,
    `2) Copy LinkedIn empresa: ${linkedInCopy}`,
    `3) Caption Instagram: ${instagramCaption}`,
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n');
};

