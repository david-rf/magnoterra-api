const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

const asTrimmedString = (value) =>
  typeof value === 'string' ? value.trim() : '';

const buildVideoUrl = (video) => {
  const explicitUrl = asTrimmedString(video?.url);

  if (explicitUrl) {
    return explicitUrl;
  }

  const videoId = asTrimmedString(video?.video_id);
  return videoId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    : '';
};

const assertLength = (label, copy, maxLength) => {
  if (copy.length > maxLength) {
    throw new Error(`${label} exceeds ${maxLength} characters`);
  }
};

export const hasVideos = (payload) =>
  Array.isArray(payload?.videos) && payload.videos.length > 0;

export const buildLinkedInCopy = () => {
  const copy = [
    'En Magno Terra compartimos una nueva capsula tecnica sobre soluciones de puesta a tierra para proyectos en Chile.',
    'Cada diseno debe revisarse segun el terreno, la ingenieria y los requerimientos del proyecto; RIC N06 aplica condicionado al proyecto.',
    `Si estas evaluando una instalacion o necesitas apoyo tecnico, conversemos en ${CONTACT_URL}`,
    LINKEDIN_HASHTAGS,
  ].join(' ');

  assertLength('LinkedIn copy', copy, LINKEDIN_MAX_LENGTH);
  return copy;
};

export const buildInstagramCaption = () => {
  const caption = [
    'Nueva capsula Magno Terra sobre puesta a tierra para proyectos en Chile.',
    'Cada solucion depende del terreno y la ingenieria; RIC N06 aplica condicionado al proyecto.',
    `Escribenos en ${CONTACT_URL}`,
    LINKEDIN_HASHTAGS,
  ].join(' ');

  assertLength('Instagram caption', caption, INSTAGRAM_MAX_LENGTH);
  return caption;
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (!hasVideos(payload)) {
    return 'NO_VIDEOS';
  }

  return payload.videos
    .map((video) => {
      const url = buildVideoUrl(video) || 'URL no disponible';

      return [
        `1) URL: ${url}`,
        `2) Copy LinkedIn empresa: ${buildLinkedInCopy()}`,
        `3) Caption Instagram: ${buildInstagramCaption()}`,
      ].join('\n');
    })
    .join('\n\n');
};
