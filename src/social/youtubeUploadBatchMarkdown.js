const CONTACT_URL = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

export const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
export const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const LINKEDIN_COPY = `Nueva pieza audiovisual de Magno Terra: mostramos nuestro enfoque tecnico en puesta a tierra para proyectos en Chile, desde el diagnostico del terreno hasta una implementacion documentada y coordinada con los requerimientos de obra. La aplicacion de RIC N06 debe revisarse segun las condiciones de cada proyecto, con trazabilidad y criterio profesional. Si necesitas apoyo para evaluar, disenar o mejorar tu sistema de puesta a tierra, conversemos: ${CONTACT_URL}

${LINKEDIN_HASHTAGS}`;

const INSTAGRAM_CAPTION = `Puesta a tierra con criterio tecnico para proyectos en Chile. En Magno Terra revisamos cada caso segun terreno, uso y exigencias aplicables; RIC N06 se evalua segun las condiciones del proyecto. Contacto: ${CONTACT_URL}`;

const normalizeVideos = (videos) => {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos
    .map((video) => ({
      ...video,
      url: typeof video?.url === 'string' ? video.url.trim() : '',
    }))
    .filter((video) => video.url.length > 0);
};

const formatVideoMarkdown = (video) => `1) URL
${video.url}

2) Copy LinkedIn empresa
${LINKEDIN_COPY}

3) Caption Instagram
${INSTAGRAM_CAPTION}`;

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  if (payload?.event !== YOUTUBE_UPLOAD_BATCH_EVENT) {
    return NO_VIDEOS_RESPONSE;
  }

  const videos = normalizeVideos(payload.videos);

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export const socialCopyLimits = {
  linkedin: 900,
  instagram: 500,
};

export const socialCopyTemplates = {
  linkedin: LINKEDIN_COPY,
  instagram: INSTAGRAM_CAPTION,
};
