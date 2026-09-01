const EVENT_NAME = 'youtube_upload_batch';
const CONTACT_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const MAX_LINKEDIN_CHARS = 900;
const MAX_INSTAGRAM_CHARS = 500;

const collapseWhitespace = (value) => String(value).replace(/\s+/g, ' ').trim();

const getVideoUrl = (video) => {
  if (!video || typeof video.url !== 'string') {
    return '';
  }

  return collapseWhitespace(video.url);
};

const buildLinkedInCopy = () => {
  const copy = [
    'En Magno Terra compartimos un nuevo registro de terreno sobre soluciones de puesta a tierra para proyectos en Chile.',
    'Cada obra requiere evaluacion tecnica, mediciones en terreno y coordinacion con los requisitos del proyecto;',
    'cuando aplica, consideramos criterios de RIC N06 segun el diseno y alcance definido.',
    `Si necesitas apoyo para tu proyecto, conversemos en ${CONTACT_CTA}.`,
    LINKEDIN_HASHTAGS,
  ].join(' ');

  if (copy.length > MAX_LINKEDIN_CHARS) {
    throw new Error('LinkedIn copy exceeds 900 characters');
  }

  return copy;
};

const buildInstagramCaption = () => {
  const caption = [
    'Nuevo registro en terreno de Magno Terra:',
    'puesta a tierra para proyectos que requieren criterio tecnico, revision en obra y coordinacion normativa segun cada alcance.',
  ].join(' ');

  if (caption.length > MAX_INSTAGRAM_CHARS) {
    throw new Error('Instagram caption exceeds 500 characters');
  }

  return caption;
};

const formatVideoMarkdown = (video) => [
  `1. URL: ${getVideoUrl(video)}`,
  `2. Copy LinkedIn empresa: ${buildLinkedInCopy()}`,
  `3. Caption Instagram: ${buildInstagramCaption()}`,
].join('\n');

export const createYoutubeUploadBatchMarkdown = (payload) => {
  if (!payload || Object.keys(payload).length === 0) {
    return 'NO_VIDEOS';
  }

  if (payload.event !== EVENT_NAME) {
    const error = new Error(`Unsupported event: ${payload.event || 'missing'}`);
    error.status = 400;
    throw error;
  }

  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const videosWithUrls = videos.filter((video) => getVideoUrl(video));

  if (videosWithUrls.length === 0) {
    return 'NO_VIDEOS';
  }

  return videosWithUrls.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export default createYoutubeUploadBatchMarkdown;
