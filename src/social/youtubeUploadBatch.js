const LINKEDIN_CTA = 'magnoterra.cl/contacto';
const LINKEDIN_HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const DEFAULT_JOB = 'proyectos de puesta a tierra';

const OMEGA_VALUE_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:ohms?|omega?s?|Ω)\b/gi;
const SEC_CERT_PATTERN = /\b(?:certificaci[oó]n|certificado|cert\.?)\s+SEC\b/gi;
const MARKDOWN_CONTROL_PATTERN = /[<>{}[\]()#*_`|]/g;

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const sanitizeJob = (job) => {
  const cleanJob = normalizeText(job)
    .replace(OMEGA_VALUE_PATTERN, '')
    .replace(SEC_CERT_PATTERN, '')
    .replace(MARKDOWN_CONTROL_PATTERN, '')
    .trim();

  return cleanJob || DEFAULT_JOB;
};

const sanitizeUrl = (url, videoId) => {
  const cleanUrl = normalizeText(url).split(/\s+/)[0];

  if (cleanUrl) {
    return cleanUrl;
  }

  const cleanVideoId = normalizeText(videoId).replace(/[^a-zA-Z0-9_-]/g, '');
  return cleanVideoId
    ? `https://www.youtube.com/watch?v=${cleanVideoId}`
    : 'URL no disponible';
};

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

export const buildLinkedInCopy = (job) => {
  const cleanJob = truncate(sanitizeJob(job), 220);
  const copy = [
    `Nuevo video de Magno Terra: trabajo en ${cleanJob}.`,
    'Una puesta a tierra confiable parte con diagnóstico, diseño y ejecución adecuados al contexto de cada instalación. La aplicación de RIC N06 siempre debe evaluarse según el proyecto.',
    `Si necesitas revisar tu sistema de puesta a tierra en Chile, conversemos: ${LINKEDIN_CTA}`,
    LINKEDIN_HASHTAGS,
  ].join('\n\n');

  return truncate(copy, 900);
};

export const buildInstagramCaption = (job) => {
  const cleanJob = truncate(sanitizeJob(job), 140);
  const caption = `Puesta a tierra bien ejecutada para ${cleanJob}. En Magno Terra revisamos cada proyecto según su contexto y la normativa aplicable.`;

  return truncate(caption, 500);
};

export const buildVideoMarkdown = (video) => {
  const url = sanitizeUrl(video?.url, video?.video_id);

  return [
    '1) URL',
    url,
    '',
    '2) Copy LinkedIn empresa',
    buildLinkedInCopy(video?.job),
    '',
    '3) Caption Instagram',
    buildInstagramCaption(video?.job),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload) => {
  if (
    !payload ||
    !Array.isArray(payload.videos) ||
    payload.videos.length === 0
  ) {
    return 'NO_VIDEOS';
  }

  const videos = payload.videos.filter(
    (video) => video && typeof video === 'object'
  );

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(buildVideoMarkdown).join('\n\n---\n\n');
};
