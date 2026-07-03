const CONTACT_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

function sanitizeForbiddenTerms(value) {
  return String(value)
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega|[oO]hmios?|[\u03a9\u2126])\b/gi,
      ''
    )
    .replace(/\b(?:cert(?:ificado|ificacion)?\s*)?SEC\b/gi, '')
    .replace(/[\u03a9\u2126]/g, '')
    .replace(/\bohms?\b/gi, '')
    .replace(/\bomega\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function truncateAtWord(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  const sliced = value.slice(0, maxLength).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');

  return lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced;
}

function normalizeJob(job) {
  if (!job) {
    return '';
  }

  if (typeof job === 'string') {
    return truncateAtWord(sanitizeForbiddenTerms(job), 90);
  }

  if (typeof job !== 'object') {
    return '';
  }

  const usefulKeys = [
    'title',
    'name',
    'project',
    'type',
    'service',
    'description',
    'location',
  ];

  const parts = usefulKeys
    .map((key) => job[key])
    .filter((value) => typeof value === 'string' && value.trim().length > 0);

  return truncateAtWord(sanitizeForbiddenTerms(parts.join(' - ')), 90);
}

function normalizeUrl(video) {
  if (video?.url && typeof video.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (
    video?.video_id &&
    typeof video.video_id === 'string' &&
    video.video_id.trim()
  ) {
    return `${YOUTUBE_WATCH_URL}${video.video_id.trim()}`;
  }

  return '';
}

function getRenderableVideos(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.videos)
  ) {
    return [];
  }

  return payload.videos
    .filter((video) => video && typeof video === 'object')
    .map((video) => ({
      url: normalizeUrl(video),
      job: video.job,
    }))
    .filter((video) => video.url);
}

function buildLinkedInCopy(job) {
  const jobContext = normalizeJob(job);
  const intro = jobContext
    ? `Nuevo video de Magno Terra sobre ${jobContext}.`
    : 'Nuevo video de Magno Terra sobre puesta a tierra.';

  return sanitizeForbiddenTerms(
    `${intro} Mostramos criterios practicos para revisar, ejecutar y documentar soluciones de puesta a tierra en proyectos electricos. Cada instalacion se evalua segun su diseno, condiciones de terreno y normativa aplicable; RIC N06 se considera cuando corresponde al proyecto. Si necesitas apoyo tecnico para tu obra o mantenimiento, conversemos en ${CONTACT_CTA}. ${LINKEDIN_HASHTAGS}`
  );
}

function buildInstagramCaption(job) {
  const jobContext = normalizeJob(job);
  const intro = jobContext
    ? `Nuevo video: ${jobContext}.`
    : 'Nuevo video de Magno Terra.';

  return sanitizeForbiddenTerms(
    `${intro} Puesta a tierra con criterio tecnico, revision en terreno y foco en seguridad. RIC N06 aplica segun el proyecto. Contacto: ${CONTACT_CTA}`
  );
}

function isYoutubeUploadBatch(payload) {
  return !payload?.event || payload.event === 'youtube_upload_batch';
}

export function buildYoutubeUploadBatchMarkdown(payload) {
  if (!isYoutubeUploadBatch(payload)) {
    return 'NO_VIDEOS';
  }

  const videos = getRenderableVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) =>
      [
        `### Video ${index + 1}`,
        '',
        '1) URL',
        video.url,
        '',
        '2) Copy LinkedIn empresa',
        buildLinkedInCopy(video.job),
        '',
        '3) Caption Instagram',
        buildInstagramCaption(video.job),
      ].join('\n')
    )
    .join('\n\n');
}

export const youtubeUploadBatchLimits = {
  linkedIn: 900,
  instagram: 500,
};
