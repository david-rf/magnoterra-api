const CONTACT_URL = 'https://magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';

export const MAX_LINKEDIN_CHARS = 900;
export const MAX_INSTAGRAM_CHARS = 500;

const linkedinCopy = `Nuevo video Magno Terra: compartimos criterios para una puesta a tierra segura, trazable y mantenible en terreno chileno. Cada solucion debe revisarse segun mediciones, condiciones del sitio y alcance tecnico; la aplicacion de RIC N06 queda condicionada al proyecto.

Conversemos sobre tu caso: ${CONTACT_URL}

${LINKEDIN_HASHTAGS}`;

const instagramCaption = `Nuevo video disponible: puesta a tierra con foco en seguridad, contexto del terreno y ejecucion responsable.

La aplicacion de RIC N06 siempre depende del alcance y condiciones del proyecto. Mira el video y cuentanos tu caso.`;

const isPresentString = (value) => typeof value === 'string' && value.trim().length > 0;

export const getPublishableVideos = (payload) => {
  if (!payload || payload.event !== 'youtube_upload_batch' || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos.filter((video) => video && isPresentString(video.url));
};

export const buildSocialCopy = () => ({
  linkedin: linkedinCopy,
  instagram: instagramCaption,
});

export const formatYoutubeUploadBatchMarkdown = (payload) => {
  const videos = getPublishableVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  const { linkedin, instagram } = buildSocialCopy();

  return videos
    .map((video, index) => {
      const number = index + 1;

      return [
        `### Video ${number}`,
        '',
        `1) URL: ${video.url.trim()}`,
        '',
        '2) Copy LinkedIn empresa:',
        '',
        linkedin,
        '',
        '3) Caption Instagram:',
        '',
        instagram,
      ].join('\n');
    })
    .join('\n\n');
};

if (linkedinCopy.length > MAX_LINKEDIN_CHARS) {
  throw new Error('LinkedIn copy exceeds 900 characters');
}

if (instagramCaption.length > MAX_INSTAGRAM_CHARS) {
  throw new Error('Instagram caption exceeds 500 characters');
}
