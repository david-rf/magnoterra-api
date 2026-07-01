const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;
const CTA_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

const FORBIDDEN_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*(?:omega|ohm(?:io|ios|s)?|\u03a9)(?:[-/]\w+)?/gi,
  /\b(?:omega|ohm(?:io|ios|s)?)\b/gi,
  /\u03a9/gi,
  /\bcert(?:ificado|ificada|ificaci(?:o|\u00f3)n|\.)?\s*SEC\b/gi,
  /\bSEC\b/gi,
];

const fallbackTopics = [
  'puesta a tierra',
  'seguridad electrica',
  'continuidad operacional',
];

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - 3).trimEnd() + '...';
};

const cleanText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return FORBIDDEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    value
  )
    .replace(/\s+/g, ' ')
    .trim();
};

const pickJobText = (job) => {
  if (typeof job === 'string') {
    return cleanText(job);
  }

  if (!job || typeof job !== 'object') {
    return '';
  }

  const fields = [
    job.title,
    job.titulo,
    job.topic,
    job.tema,
    job.summary,
    job.resumen,
    job.description,
    job.descripcion,
  ];

  return cleanText(fields.find((field) => cleanText(field)) || '');
};

const getTopic = (video, index) => {
  const jobTopic = pickJobText(video.job);

  if (jobTopic) {
    return truncate(jobTopic, 120);
  }

  return fallbackTopics[index % fallbackTopics.length];
};

const buildLinkedInCopy = (video, index) => {
  const topic = getTopic(video, index);
  const copy = [
    `Nuevo video de Magno Terra sobre ${topic}.`,
    'Compartimos criterios practicos para abordar proyectos de puesta a tierra con foco en seguridad, diagnostico y continuidad operacional.',
    'La aplicacion de RIC N06 siempre debe evaluarse segun las condiciones y alcance de cada proyecto.',
    `Conversemos sobre tu caso en ${CTA_URL}.`,
    HASHTAGS,
  ].join(' ');

  return truncate(copy, LINKEDIN_LIMIT);
};

const buildInstagramCaption = (video, index) => {
  const topic = getTopic(video, index);
  const caption = [
    `Nuevo video: ${topic}.`,
    'En Magno Terra apoyamos proyectos de puesta a tierra con mirada tecnica y foco en seguridad.',
    `Agenda una conversacion en ${CTA_URL}.`,
  ].join(' ');

  return truncate(caption, INSTAGRAM_LIMIT);
};

const isValidVideo = (video) =>
  video &&
  typeof video === 'object' &&
  typeof video.url === 'string' &&
  video.url.trim();

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload.videos)
    ? payload.videos.filter(isValidVideo)
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) =>
      [
        `### Video ${index + 1}`,
        '',
        `1. **URL:** ${video.url.trim()}`,
        `2. **Copy LinkedIn empresa:** ${buildLinkedInCopy(video, index)}`,
        `3. **Caption Instagram:** ${buildInstagramCaption(video, index)}`,
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export const youtubeUploadBatchMarkdownLimits = {
  linkedin: LINKEDIN_LIMIT,
  instagram: INSTAGRAM_LIMIT,
};
