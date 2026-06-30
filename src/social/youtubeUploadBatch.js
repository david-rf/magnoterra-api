const LINKEDIN_COPY =
  'En Magno Terra acompanamos proyectos electricos con soluciones de puesta a tierra disenadas para condiciones reales de terreno. Este video muestra nuestro enfoque en planificacion, ejecucion responsable y documentacion tecnica para instalaciones en Chile, considerando RIC N06 cuando corresponde al proyecto. Si necesitas revisar, mejorar o ejecutar tu sistema de puesta a tierra, conversemos en magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const INSTAGRAM_CAPTION =
  'Puesta a tierra para proyectos electricos en Chile: planificacion, ejecucion ordenada y criterios tecnicos aplicables, con RIC N06 cuando corresponde al proyecto. Contacto: magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

const youtubeUrlFromId = (videoId) => {
  if (typeof videoId !== 'string' || videoId.trim() === '') {
    return null;
  }

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId.trim())}`;
};

const getVideoUrl = (video) => {
  if (video && typeof video.url === 'string' && video.url.trim() !== '') {
    return video.url.trim();
  }

  return youtubeUrlFromId(video?.video_id);
};

const formatVideoMarkdown = (video) => {
  const url = getVideoUrl(video);

  return [
    `1) URL: ${url}`,
    `2) Copy LinkedIn empresa: ${LINKEDIN_COPY}`,
    `3) Caption Instagram: ${INSTAGRAM_CAPTION}`,
  ].join('\n');
};

export const generateYoutubeUploadBatchMarkdown = (payload) => {
  const videos = Array.isArray(payload?.videos) ? payload.videos : [];
  const validVideos = videos.filter((video) => getVideoUrl(video));

  if (validVideos.length === 0) {
    return 'NO_VIDEOS';
  }

  return validVideos.map(formatVideoMarkdown).join('\n\n');
};

export { INSTAGRAM_CAPTION, LINKEDIN_COPY };
