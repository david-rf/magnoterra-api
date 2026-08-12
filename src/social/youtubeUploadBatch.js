const EVENT_NAME = 'youtube_upload_batch';
const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;

const REQUIRED_LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_CTA = 'magnoterra.cl/contacto';

const LINKEDIN_COPY =
  'En Magno Terra acompanamos proyectos de puesta a tierra con foco tecnico, trazabilidad y criterios normativos aplicables segun el alcance de cada proyecto. Si estas evaluando, manteniendo o documentando una solucion para tu instalacion, conversemos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const INSTAGRAM_CAPTION =
  'Cada proyecto de puesta a tierra requiere una revision tecnica acorde a su contexto. En Magno Terra trabajamos con criterio, terreno y documentacion clara. Conversemos en magnoterra.cl/contacto';

const ensureMaxLength = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength - 1).trimEnd() + '.';
};

const getVideoUrl = (video) => {
  if (video && typeof video.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (video && typeof video.video_id === 'string' && video.video_id.trim()) {
    return `Video ${video.video_id.trim()}`;
  }

  return 'URL no disponible';
};

const getVideos = (payload) => {
  if (!payload || payload.event !== EVENT_NAME || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos.filter((video) => video && typeof video === 'object');
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  const linkedInCopy = ensureMaxLength(LINKEDIN_COPY, LINKEDIN_MAX_LENGTH);
  const instagramCaption = ensureMaxLength(INSTAGRAM_CAPTION, INSTAGRAM_MAX_LENGTH);

  return videos
    .map((video, index) => {
      const url = getVideoUrl(video);

      return [
        `### Video ${index + 1}`,
        `1) URL: ${url}`,
        `2) Copy LinkedIn empresa: ${linkedInCopy}`,
        `3) Caption Instagram: ${instagramCaption}`,
      ].join('\n');
    })
    .join('\n\n');
};

export {
  CONTACT_CTA,
  EVENT_NAME,
  INSTAGRAM_MAX_LENGTH,
  LINKEDIN_MAX_LENGTH,
  REQUIRED_LINKEDIN_HASHTAGS,
};
