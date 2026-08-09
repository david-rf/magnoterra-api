const CTA_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

const restrictedPatterns = [
  /\b\d+(?:[,.]\d+)?\s*(?:ohms?|ohmios?|omega|Ω|Ω)\b/gi,
  /\b(?:cert(?:ificacion|ificado)?\s*)?SEC\b/gi,
  /\bRIC\s*N0?6\b/gi,
];

const normalizeWhitespace = (value) =>
  String(value).replace(/\s+/g, ' ').trim();

const truncateAtWord = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  const truncated = value.slice(0, maxLength).trim();
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace <= Math.floor(maxLength * 0.7)) {
    return truncated;
  }

  return truncated.slice(0, lastSpace).trim();
};

const sanitizeJob = (job) => {
  if (typeof job !== 'string') {
    return '';
  }

  let sanitized = normalizeWhitespace(job)
    .replace(/[#[\]()*_`<>]/g, '')
    .slice(0, 120);

  for (const pattern of restrictedPatterns) {
    sanitized = sanitized.replace(pattern, 'criterio tecnico');
  }

  return normalizeWhitespace(sanitized);
};

const normalizeUrl = (url) => {
  if (typeof url !== 'string') {
    return null;
  }

  const normalized = url.trim();

  if (!normalized) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalized);
    return HTTP_PROTOCOLS.has(parsedUrl.protocol) ? normalized : null;
  } catch (_error) {
    return null;
  }
};

const normalizeVideos = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (payload.event && payload.event !== 'youtube_upload_batch') {
    return [];
  }

  if (!Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos
    .map((video) => {
      if (!video || typeof video !== 'object') {
        return null;
      }

      const url = normalizeUrl(video.url);

      if (!url) {
        return null;
      }

      return {
        url,
        job: sanitizeJob(video.job),
      };
    })
    .filter(Boolean);
};

export const createSocialCopyForVideo = (video) => {
  const jobContext = video.job ? ` para ${video.job}` : '';

  const linkedin = truncateAtWord(
    normalizeWhitespace(
      `Compartimos un nuevo registro en terreno${jobContext}: soluciones de puesta a tierra pensadas para las condiciones reales de cada instalacion. La aplicacion de criterios como RIC N06 queda condicionada al alcance, la ingenieria y los requisitos del proyecto. Si necesitas evaluar una solucion para tu obra, conversemos en ${CTA_URL}. ${REQUIRED_HASHTAGS}`
    ),
    LINKEDIN_MAX_LENGTH
  );

  const instagram = truncateAtWord(
    normalizeWhitespace(
      `Nuevo registro en terreno de Magno Terra${jobContext}. Puesta a tierra con criterios tecnicos segun cada proyecto. Contacto: ${CTA_URL}.`
    ),
    INSTAGRAM_MAX_LENGTH
  );

  return {
    url: video.url,
    linkedin,
    instagram,
  };
};

export const renderYoutubeUploadBatchMarkdown = (payload) => {
  const videos = normalizeVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) => {
      const copy = createSocialCopyForVideo(video);

      return [
        `### Video ${index + 1}`,
        `1) URL: ${copy.url}`,
        `2) Copy LinkedIn empresa: ${copy.linkedin}`,
        `3) Caption Instagram: ${copy.instagram}`,
      ].join('\n');
    })
    .join('\n\n');
};

export {
  CTA_URL,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_HASHTAGS,
};
