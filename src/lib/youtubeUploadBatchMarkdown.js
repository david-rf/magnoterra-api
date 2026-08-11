const REQUIRED_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const CONTACT_URL = 'magnoterra.cl/contacto';
const YOUTUBE_UPLOAD_BATCH_EVENT = 'youtube_upload_batch';
const NO_VIDEOS_RESPONSE = 'NO_VIDEOS';

const MAX_JOB_LENGTH = 120;
const MAX_LINKEDIN_LENGTH = 900;
const MAX_INSTAGRAM_LENGTH = 500;

const sanitizeJob = (job) => {
  if (typeof job !== 'string') {
    return 'un proyecto electrico';
  }

  const cleaned = job
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:omega|ohmios?|ohms?)\b/gi, 'requisitos tecnicos')
    .replace(/\b\d+(?:[.,]\d+)?\s*Ω\b/gi, 'requisitos tecnicos')
    .replace(/Ω/g, '')
    .replace(/\bcert(?:ificacion|ificado)?\.?\s*SEC\b/gi, 'documentacion del proyecto')
    .replace(/\bSEC\b/gi, '')
    .replace(/[<>{}[\]`*_#|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_JOB_LENGTH)
    .trim();

  return cleaned || 'un proyecto electrico';
};

const trimToLimit = (text, limit) => {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1).trimEnd()}.`;
};

const buildLinkedInCopy = (job) => {
  const copy = `Nuevo video de Magno Terra: compartimos una mirada practica sobre ${job} y la importancia de una puesta a tierra bien planificada para instalaciones electricas en Chile.

Nuestro enfoque combina revision tecnica, criterios de seguridad y soluciones ajustadas al terreno. La aplicacion de RIC N06 se evalua segun las condiciones de cada proyecto.

Si necesitas revisar o ejecutar tu sistema de puesta a tierra, conversemos en ${CONTACT_URL}

${REQUIRED_HASHTAGS}`;

  return trimToLimit(copy, MAX_LINKEDIN_LENGTH);
};

const buildInstagramCaption = (job) => {
  const caption = `Nuevo video: puesta a tierra aplicada a ${job}. Seguridad, criterio tecnico y soluciones segun terreno.

RIC N06 se revisa caso a caso segun el proyecto.

Contacto: ${CONTACT_URL}
${REQUIRED_HASHTAGS}`;

  return trimToLimit(caption, MAX_INSTAGRAM_LENGTH);
};

const hasVideos = (payload) => Array.isArray(payload?.videos) && payload.videos.length > 0;

const validVideos = (payload) =>
  payload.videos.filter((video) => typeof video?.url === 'string' && video.url.trim().length > 0);

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (!payload || !hasVideos(payload)) {
    return NO_VIDEOS_RESPONSE;
  }

  const videos = validVideos(payload);

  if (videos.length === 0) {
    return NO_VIDEOS_RESPONSE;
  }

  return videos
    .map((video) => {
      const url = video.url.trim();
      const job = sanitizeJob(video.job);
      const linkedInCopy = buildLinkedInCopy(job);
      const instagramCaption = buildInstagramCaption(job);

      return `1) URL
${url}

2) Copy LinkedIn empresa
${linkedInCopy}

3) Caption Instagram
${instagramCaption}`;
    })
    .join('\n\n---\n\n');
};

export { YOUTUBE_UPLOAD_BATCH_EVENT, NO_VIDEOS_RESPONSE };
