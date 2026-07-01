const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const LINKEDIN_COPY = [
  'Nuevo video de Magno Terra: revisamos criterios practicos para proyectos de puesta a tierra',
  'y como abordarlos con una mirada tecnica, responsable y ajustada a obra.',
  'La aplicacion de RIC N06 debe evaluarse segun las condiciones y alcance de cada proyecto;',
  'por eso conviene revisar antecedentes antes de definir soluciones.',
  'Si tu empresa necesita apoyo en puesta a tierra, escribenos en magnoterra.cl/contacto.',
  '#PuestaATierra #Chile #MagnoTerra',
].join(' ');

const INSTAGRAM_CAPTION = [
  'Puesta a tierra con mirada tecnica y aplicada a cada proyecto.',
  'RIC N06 siempre debe revisarse segun el alcance y las condiciones de obra.',
  'Contacto: magnoterra.cl/contacto',
  '#PuestaATierra #Chile #MagnoTerra',
].join(' ');

const normalizeLine = (value) => String(value).trim().replace(/\s+/g, ' ');

const getVideosWithUrls = (payload) => {
  if (!payload || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos.filter((video) => (
    video
    && typeof video.url === 'string'
    && video.url.trim().length > 0
  ));
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getVideosWithUrls(payload);

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos.map((video) => [
    `1. URL: ${normalizeLine(video.url)}`,
    `2. Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
    `3. Caption Instagram: ${INSTAGRAM_CAPTION}`,
  ].join('\n')).join('\n\n---\n\n');
};

export { NO_VIDEOS_RESPONSE, LINKEDIN_COPY, INSTAGRAM_CAPTION };
