const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_LENGTH = 900;
const MAX_INSTAGRAM_LENGTH = 500;

const normalizeText = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
};

const removeRestrictedTerms = (value) => {
  const withoutRestrictedTerms = value
    .replace(/\bcert(?:ificacion|ificado)?\s+SEC\b/gi, 'validacion tecnica')
    .replace(/(?:\b\d+(?:[.,]\d+)?\s*)?(?:\bohms?\b|\bomega\b|\u03a9)/gi, 'mediciones tecnicas')
    .replace(/\s+/g, ' ')
    .trim();

  return withoutRestrictedTerms || 'este proyecto';
};

const trimToLength = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const trimWithSuffix = (body, suffix, maxLength) => {
  const copy = `${body}${suffix}`;

  if (copy.length <= maxLength) {
    return copy;
  }

  const availableBodyLength = maxLength - suffix.length - 3;
  return `${body.slice(0, availableBodyLength).trimEnd()}...${suffix}`;
};

const getJobDescription = (job) => trimToLength(
  removeRestrictedTerms(normalizeText(job, 'este proyecto')),
  140,
);

export const buildLinkedInCopy = (video) => {
  const job = getJobDescription(video.job);
  const body = [
    `Nuevo video de Magno Terra: mostramos parte del trabajo de puesta a tierra en ${job}.`,
    'Cada proyecto exige revisar terreno, alcance y normativa aplicable; RIC N06 se evalua segun las condiciones del proyecto.',
    `Si necesitas evaluar o mejorar tu sistema, conversemos en ${CONTACT_URL}.`,
  ].join(' ');
  const suffix = `\n\n${HASHTAGS}`;

  return trimWithSuffix(body, suffix, MAX_LINKEDIN_LENGTH);
};

export const buildInstagramCaption = (video) => {
  const job = getJobDescription(video.job);
  const caption = [
    `Nuevo video de puesta a tierra en ${job}.`,
    `En Magno Terra revisamos cada proyecto segun sus condiciones y la normativa aplicable.`,
    `Conversemos en ${CONTACT_URL}.`,
  ].join(' ');

  return trimToLength(caption, MAX_INSTAGRAM_LENGTH);
};

export const createYoutubeUploadBatchMarkdown = (payload = {}) => {
  const body = payload && typeof payload === 'object' ? payload : {};
  const videos = Array.isArray(body.videos)
    ? body.videos.filter((video) => video && typeof video === 'object')
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map((video, index) => {
    const videoId = normalizeText(video.video_id, `video-${index + 1}`);
    const url = normalizeText(video.url, 'URL no informada');

    return [
      `### ${videoId}`,
      '',
      '1) URL',
      url,
      '',
      '2) Copy LinkedIn empresa',
      buildLinkedInCopy(video),
      '',
      '3) Caption Instagram',
      buildInstagramCaption(video),
    ].join('\n');
  }).join('\n\n');
};

