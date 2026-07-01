const CONTACT_URL = 'magnoterra.cl/contacto';
const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const EVENT_NAME = 'youtube_upload_batch';

const LINKEDIN_COPY = `Nuevo video tecnico de Magno Terra: compartimos criterios practicos para abordar sistemas de puesta a tierra en proyectos electricos en Chile. Cada solucion debe evaluarse segun el terreno, el alcance de la instalacion y las exigencias normativas aplicables; RIC N06 se revisa segun corresponda al proyecto.

Si necesitas apoyo tecnico para tu proyecto, conversemos en ${CONTACT_URL}

${REQUIRED_HASHTAGS}`;

const INSTAGRAM_CAPTION = `Nuevo video tecnico de Magno Terra sobre puesta a tierra para proyectos en Chile. RIC N06 se revisa segun corresponda al proyecto. Contactanos en ${CONTACT_URL}

${REQUIRED_HASHTAGS}`;

const asVideoUrl = (video) => {
  if (typeof video?.url === 'string' && video.url.trim()) {
    return video.url.trim();
  }

  if (typeof video?.video_id === 'string' && video.video_id.trim()) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(video.video_id.trim())}`;
  }

  return '';
};

export const isYoutubeUploadBatchEvent = (payload = {}) =>
  payload?.event === EVENT_NAME || payload?.event === undefined;

export const formatYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const videoUrls = videos.map(asVideoUrl).filter(Boolean);

  if (videoUrls.length === 0) {
    return 'NO_VIDEOS';
  }

  return videoUrls
    .map((url, index) =>
      [
        `### Video ${index + 1}`,
        '',
        '1) URL',
        url,
        '',
        '2) Copy LinkedIn empresa',
        LINKEDIN_COPY,
        '',
        '3) Caption Instagram',
        INSTAGRAM_CAPTION,
      ].join('\n')
    )
    .join('\n\n---\n\n');
};

export const limits = {
  linkedInMaxLength: 900,
  instagramMaxLength: 500,
};

export const templates = {
  linkedInCopy: LINKEDIN_COPY,
  instagramCaption: INSTAGRAM_CAPTION,
};
