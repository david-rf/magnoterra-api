const CONTACT_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'contenido tecnico de puesta a tierra';

const JOB_FIELDS = [
  'title',
  'titulo',
  'topic',
  'tema',
  'service',
  'servicio',
  'project',
  'proyecto',
  'description',
  'descripcion',
  'summary',
  'resumen',
  'location',
  'ubicacion',
];

const OMEGA_VALUE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:Ω|ohm(?:io)?s?|omega)\b/gi;
const SEC_CERT_PATTERN = /\b(?:cert(?:ificado|ificacion)?\.?\s*(?:SEC|S\.E\.C\.)|(?:SEC|S\.E\.C\.)\s*cert(?:ificado|ificacion)?)\b/gi;
const RIC_N06_PATTERN = /\bRIC\s*N[°º.]?\s*0?6\b/gi;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;

const asString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const sanitizeMarketingText = (value) => {
  const withoutUnsafeClaims = asString(value)
    .replace(URL_PATTERN, '')
    .replace(OMEGA_VALUE_PATTERN, 'valores medidos')
    .replace(SEC_CERT_PATTERN, 'cumplimiento normativo aplicable')
    .replace(RIC_N06_PATTERN, 'RIC N06 cuando aplique al proyecto')
    .replace(/[`*_#[\]<>]/g, '');

  return normalizeWhitespace(withoutUnsafeClaims);
};

const firstMeaningfulJobText = (job) => {
  if (typeof job === 'string') {
    return job;
  }

  if (!job || typeof job !== 'object' || Array.isArray(job)) {
    return '';
  }

  const fields = JOB_FIELDS
    .map((field) => job[field])
    .filter((value) => value !== null && value !== undefined)
    .map((value) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      if (typeof value === 'object') {
        return '';
      }

      return asString(value);
    })
    .filter(Boolean);

  return fields.slice(0, 3).join(' - ');
};

const getTopic = (job) => {
  const topic = sanitizeMarketingText(firstMeaningfulJobText(job));

  if (!topic) {
    return DEFAULT_TOPIC;
  }

  return topic.length > 160 ? `${topic.slice(0, 157).trim()}...` : topic;
};

const truncateBeforeSuffix = (text, suffix, limit) => {
  if (text.length <= limit) {
    return text;
  }

  const available = limit - suffix.length - 1;
  if (available <= 0) {
    return suffix.slice(0, limit);
  }

  const truncated = text.slice(0, available).replace(/\s+\S*$/, '').trim();
  return `${truncated} ${suffix}`.trim();
};

export const buildLinkedInCopy = (job) => {
  const topic = getTopic(job);
  const suffix = `Conversemos sobre tu proyecto: ${CONTACT_URL}\n\n${REQUIRED_HASHTAGS}`;
  const copy = [
    `Nuevo video de Magno Terra: ${topic}.`,
    'Compartimos criterios practicos para evaluar soluciones de puesta a tierra con foco en seguridad, continuidad operacional y condiciones reales de terreno.',
    'Toda referencia a RIC N06 debe revisarse segun el alcance, la ingenieria y las exigencias especificas de cada proyecto.',
    suffix,
  ].join('\n\n');

  return truncateBeforeSuffix(copy, suffix, 900);
};

export const buildInstagramCaption = (job) => {
  const topic = getTopic(job);
  const suffix = `${CONTACT_URL} ${REQUIRED_HASHTAGS}`;
  const caption = `Nuevo video: ${topic}. Puesta a tierra para proyectos reales en Chile, con mirada tecnica y revision caso a caso. Mas info: ${suffix}`;

  return truncateBeforeSuffix(caption, suffix, 500);
};

export const generateYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) => {
      const url = normalizeWhitespace(asString(video?.url)) || 'URL no disponible';
      const videoLabel = sanitizeMarketingText(video?.video_id) || `video-${index + 1}`;

      return [
        `## ${videoLabel}`,
        '',
        `1) URL: ${url}`,
        '2) Copy LinkedIn empresa:',
        buildLinkedInCopy(video?.job),
        '3) Caption Instagram:',
        buildInstagramCaption(video?.job),
      ].join('\n');
    })
    .join('\n\n');
};

export { CONTACT_URL, REQUIRED_HASHTAGS };
