const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const TARGET_EVENT = 'youtube_upload_batch';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';
const MAX_TOPIC_LENGTH = 120;

const stripForbiddenClaims = (value) => String(value ?? '')
  .replace(/https?:\/\/\S+/gi, '')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega|omegas)\b/gi, '')
  .replace(/\b\d+(?:[.,]\d+)?\s*Ω\b/gi, '')
  .replace(/[ΩΩ]/g, '')
  .replace(/\bcert(?:ificaci[oó]n|ificado|\.?)?\s*SEC\b/gi, '')
  .replace(/\bSEC\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim();

const limitText = (value, maxLength) => {
  const text = String(value ?? '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
};

const stringifyJob = (job) => {
  if (!job) {
    return '';
  }

  if (typeof job === 'string') {
    return job;
  }

  if (typeof job === 'object') {
    const preferredFields = [
      'title',
      'name',
      'topic',
      'summary',
      'description',
      'type',
      'service',
      'project',
    ];

    return preferredFields
      .map((field) => job[field])
      .filter(Boolean)
      .join(' ');
  }

  return String(job);
};

const getVideoUrl = (video) => {
  const url = String(video?.url ?? '').trim();

  if (url) {
    return url;
  }

  const videoId = String(video?.video_id ?? '').trim();

  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : '';
};

const getTopic = (video) => {
  const rawTopic = stringifyJob(video?.job);
  const sanitizedTopic = stripForbiddenClaims(rawTopic)
    .replace(/\bRIC\s*N(?:°|º|o\.?|ro\.?)?\s*0?6\b/gi, 'RIC N06')
    .trim();

  return limitText(sanitizedTopic || 'puesta a tierra y seguridad electrica', MAX_TOPIC_LENGTH);
};

const buildLinkedInCopy = (topic) => limitText(
  [
    `Nuevo video de Magno Terra: ${topic}.`,
    'Compartimos criterios practicos para coordinar soluciones de puesta a tierra en proyectos de Chile, con foco en seguridad, continuidad operacional y ejecucion responsable.',
    'La aplicacion de RIC N06 debe evaluarse segun el alcance y las condiciones de cada proyecto.',
    `Necesitas apoyo tecnico? Conversemos en ${CONTACT_URL}.`,
    LINKEDIN_HASHTAGS,
  ].join(' '),
  900,
);

const buildInstagramCaption = (topic) => limitText(
  [
    `Nuevo video: ${topic}.`,
    'Puesta a tierra clara, responsable y pensada para cada proyecto.',
    `Escribenos en ${CONTACT_URL}.`,
  ].join(' '),
  500,
);

const renderVideoMarkdown = (video, index) => {
  const topic = getTopic(video);
  const url = getVideoUrl(video);

  return [
    `## Video ${index + 1}`,
    '',
    `1) URL: ${url}`,
    '',
    `2) Copy LinkedIn empresa: ${buildLinkedInCopy(topic)}`,
    '',
    `3) Caption Instagram: ${buildInstagramCaption(topic)}`,
  ].join('\n');
};

export const renderYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map(renderVideoMarkdown).join('\n\n---\n\n');
};

export {
  CONTACT_URL,
  LINKEDIN_HASHTAGS,
  NO_VIDEOS_RESPONSE,
  TARGET_EVENT,
};
