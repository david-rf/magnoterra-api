const LINKEDIN_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_LENGTH = 900;
const MAX_INSTAGRAM_LENGTH = 500;

const FORBIDDEN_REPLACEMENTS = [
  {
    pattern: /\b\d+(?:[.,]\d+)?\s*(?:ohm(?:io)?s?|omega|Ω)\b/gi,
    replacement: 'un valor técnico definido en terreno',
  },
  {
    pattern: /\b(?:cert(?:ificado|ificaci.n)?\s*)?SEC\b/gi,
    replacement: 'la normativa aplicable',
  },
];

const collapseWhitespace = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeText = (value) =>
  FORBIDDEN_REPLACEMENTS.reduce(
    (text, { pattern, replacement }) => text.replace(pattern, replacement),
    collapseWhitespace(value)
  );

const getJobText = (job) => {
  if (typeof job === 'string') {
    return job;
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  return (
    job.title ||
    job.name ||
    job.description ||
    job.service ||
    job.tipo ||
    job.type ||
    ''
  );
};

const shorten = (text, maxLength, requiredSuffix = '') => {
  if (text.length <= maxLength) {
    return text;
  }

  const available = maxLength - requiredSuffix.length - 1;
  const truncated = text.slice(0, Math.max(0, available)).trimEnd();

  return requiredSuffix ? `${truncated} ${requiredSuffix}` : truncated;
};

const buildLinkedInCopy = (video) => {
  const jobText = sanitizeText(getJobText(video.job));
  const focus = jobText || 'un nuevo registro de nuestro trabajo en terreno';
  const copy = [
    `Compartimos ${focus} para mostrar como abordamos soluciones de puesta a tierra con criterio tecnico, seguridad y planificacion en terreno.`,
    'Cada proyecto requiere revisar condiciones reales, objetivos de continuidad operacional y criterios normativos; la aplicacion de RIC N06 queda condicionada al alcance y caracteristicas del proyecto.',
    `Conversemos sobre tu caso en ${LINKEDIN_CTA}.`,
    LINKEDIN_HASHTAGS,
  ].join('\n\n');

  return shorten(copy, MAX_LINKEDIN_LENGTH, `${LINKEDIN_CTA} ${LINKEDIN_HASHTAGS}`);
};

const buildInstagramCaption = (video) => {
  const jobText = sanitizeText(getJobText(video.job));
  const focus = jobText || 'trabajo en terreno';
  const caption = [
    `Nuevo video: ${focus}.`,
    'En Magno Terra trabajamos la puesta a tierra con diagnostico, ejecucion responsable y criterios tecnicos ajustados a cada proyecto.',
    'La aplicacion de RIC N06 depende del alcance y condiciones del proyecto.',
  ].join(' ');

  return shorten(caption, MAX_INSTAGRAM_LENGTH);
};

const formatVideoMarkdown = (video) => {
  const url = collapseWhitespace(video.url);
  const linkedinCopy = buildLinkedInCopy(video);
  const instagramCaption = buildInstagramCaption(video);

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    linkedinCopy,
    '',
    '3) Caption Instagram',
    instagramCaption,
  ].join('\n');
};

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .filter((video) => video && typeof video === 'object')
    .map(formatVideoMarkdown)
    .join('\n\n---\n\n') || 'NO_VIDEOS';
};

export const YOUTUBE_UPLOAD_BATCH_LIMITS = {
  linkedin: MAX_LINKEDIN_LENGTH,
  instagram: MAX_INSTAGRAM_LENGTH,
};
