import { URL } from 'node:url';

export const EMPTY_VIDEOS_RESPONSE = 'NO_VIDEOS';

const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_TOPIC = 'puesta a tierra aplicada en proyectos';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const JOB_TEXT_KEYS = [
  'title',
  'titulo',
  'topic',
  'tema',
  'description',
  'descripcion',
  'name',
  'nombre',
  'summary',
  'resumen',
];

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos.filter(Boolean) : [];

  if (videos.length === 0) {
    return EMPTY_VIDEOS_RESPONSE;
  }

  return videos.map(renderVideoMarkdown).join('\n\n');
};

const renderVideoMarkdown = (video, index) => {
  const videoId = normalizeText(video.video_id) || `${index + 1}`;
  const url = normalizeUrl(video.url);
  const topic = topicFromJob(video.job);
  const linkedInCopy = buildLinkedInCopy(topic);
  const instagramCaption = buildInstagramCaption(topic);

  return [
    `### Video ${videoId}`,
    '',
    `1) URL: ${url}`,
    '',
    '2) Copy LinkedIn empresa (<=900 chars):',
    linkedInCopy,
    '',
    '3) Caption Instagram (<=500 chars):',
    instagramCaption,
  ].join('\n');
};

const buildLinkedInCopy = (topic) => {
  const copy = [
    `Nuevo video de Magno Terra: ${topic}.`,
    'Compartimos una mirada tecnica para proyectos de puesta a tierra en Chile, desde la evaluacion inicial hasta la seleccion de soluciones segun las condiciones de terreno y obra.',
    'Cuando aplica, criterios como RIC N06 deben revisarse segun el alcance y las exigencias especificas de cada proyecto.',
    `Conversemos sobre tu caso en ${CONTACT_URL}.`,
    '',
    HASHTAGS,
  ].join('\n\n');

  return limitText(copy, LINKEDIN_LIMIT);
};

const buildInstagramCaption = (topic) => {
  const caption = [
    `Nuevo video: ${topic}.`,
    'Puesta a tierra con enfoque tecnico, criterio de terreno y recomendaciones segun cada proyecto.',
    `Mas info en ${CONTACT_URL}.`,
    HASHTAGS,
  ].join('\n\n');

  return limitText(caption, INSTAGRAM_LIMIT);
};

const topicFromJob = (job) => {
  const rawTopic = extractJobText(job);
  const safeTopic = sanitizeRestrictedClaims(rawTopic);

  return limitText(safeTopic || DEFAULT_TOPIC, 160);
};

const extractJobText = (job) => {
  if (typeof job === 'string') {
    return normalizeText(job);
  }

  if (!job || typeof job !== 'object') {
    return DEFAULT_TOPIC;
  }

  for (const key of JOB_TEXT_KEYS) {
    const value = job[key];

    if (typeof value === 'string' && normalizeText(value)) {
      return normalizeText(value);
    }
  }

  return DEFAULT_TOPIC;
};

const sanitizeRestrictedClaims = (value) => normalizeText(value)
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:io)?s?)\b/gi, '')
  .replace(new RegExp('\\b\\d+(?:[.,]\\d+)?\\s*\\u03a9\\b', 'gi'), '')
  .replace(/\b(?:cert(?:ificacion|ificado)?\s+(?:\w+\s+){0,3}SEC|SEC\s+(?:\w+\s+){0,3}cert(?:ificacion|ificado)?)\b/gi, '')
  .replace(/\bSEC\b/g, '')
  .replace(/\bRIC\s*N(?:o|ro|\.|\u00b0|\u00ba)?\s*0?6\b/gi, 'criterios normativos aplicables segun proyecto')
  .replace(/\s{2,}/g, ' ')
  .trim();

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

const normalizeUrl = (value) => {
  if (typeof value !== 'string') {
    return 'URL no disponible';
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch (_error) {
    return 'URL no disponible';
  }

  return 'URL no disponible';
};

const limitText = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};
