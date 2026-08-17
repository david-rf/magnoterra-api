const LINKEDIN_MAX_LENGTH = 900;
const INSTAGRAM_MAX_LENGTH = 500;
const REQUIRED_LINKEDIN_TAIL =
  'Conversemos en magnoterra.cl/contacto\n\n#PuestaATierra #Chile #MagnoTerra';

const collapseWhitespace = (value) => String(value).replace(/\s+/g, ' ').trim();

const sanitizeJob = (value) => {
  const normalized = collapseWhitespace(value || 'proyecto de puesta a tierra');

  return normalized
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:[\u03a9\u2126]|\bohm(?:s)?\b|\bomega\b)/gi,
      'resistencia objetivo'
    )
    .replace(/\bcertificaci[o\u00f3]n\s+SEC\b/gi, 'documentacion tecnica')
    .replace(/\bcertificad[oa]s?\s+SEC\b/gi, 'documentado')
    .replace(
      /\bRIC\s*N(?:\u00b0|\u00ba|o|ro)?\s*0?6\b/gi,
      'RIC N06, segun corresponda al proyecto'
    )
    .replace(/\bSEC\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncate = (value, maxLength) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const buildLinkedInCopy = (video) => {
  const job = sanitizeJob(video.job);
  const intro =
    `Compartimos un nuevo registro de trabajo en terreno: ${job}. ` +
    'En Magno Terra acompanamos proyectos con soluciones de puesta a tierra ' +
    'pensadas para seguridad, continuidad operacional y criterios tecnicos ' +
    'definidos caso a caso.';
  const body =
    '\n\nSi tu instalacion necesita evaluacion, diseno o ejecucion especializada, ' +
    'nuestro equipo puede revisar el alcance y orientar los siguientes pasos.';
  const maxContentLength =
    LINKEDIN_MAX_LENGTH - REQUIRED_LINKEDIN_TAIL.length - body.length - 2;
  const content = truncate(intro, Math.max(0, maxContentLength));

  return `${content}${body}\n\n${REQUIRED_LINKEDIN_TAIL}`;
};

const buildInstagramCaption = (video) => {
  const job = sanitizeJob(video.job);
  const caption =
    `Nuevo video en terreno: ${job}. ` +
    'Puesta a tierra para proyectos que requieren criterio tecnico, seguridad y continuidad. ' +
    'Contacto: magnoterra.cl/contacto #PuestaATierra #Chile #MagnoTerra';

  return truncate(caption, INSTAGRAM_MAX_LENGTH);
};

const formatVideoMarkdown = (video, index) => {
  const title = video.video_id ? `Video ${video.video_id}` : `Video ${index + 1}`;

  return [
    `### ${title}`,
    '',
    `1) URL: ${collapseWhitespace(video.url || '')}`,
    '',
    '2) Copy LinkedIn empresa:',
    '',
    buildLinkedInCopy(video),
    '',
    '3) Caption Instagram:',
    '',
    buildInstagramCaption(video),
  ].join('\n');
};

export const buildYoutubeUploadBatchMarkdown = (payload = {}) => {
  const videos = Array.isArray(payload?.videos)
    ? payload.videos.filter((video) => video && typeof video === 'object')
    : [];

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos.map(formatVideoMarkdown).join('\n\n---\n\n');
};

export const limits = {
  linkedIn: LINKEDIN_MAX_LENGTH,
  instagram: INSTAGRAM_MAX_LENGTH,
};
