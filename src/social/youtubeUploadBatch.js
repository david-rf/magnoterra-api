const CONTACT_URL = 'magnoterra.cl/contacto';
const HASHTAGS = '#PuestaATierra #Chile #MagnoTerra';
const LINKEDIN_LIMIT = 900;
const INSTAGRAM_LIMIT = 500;

const compactWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const trimToLength = (text, limit) => {
  if (text.length <= limit) {
    return text;
  }

  if (limit <= 3) {
    return '.'.repeat(Math.max(0, limit));
  }

  return `${text.slice(0, limit - 3).trimEnd()}...`;
};

const buildProjectContext = (job, limit) => {
  const normalizedJob = compactWhitespace(job);

  if (!normalizedJob) {
    return '';
  }

  return ` para ${trimToLength(normalizedJob, limit)}`;
};

export const buildLinkedInCopy = (job) => {
  const projectContext = buildProjectContext(job, 140);
  const body = [
    `Nuevo video: revisamos criterios de puesta a tierra${projectContext} en proyectos electricos en Chile.`,
    'En Magno Terra priorizamos diagnostico tecnico, documentacion clara y coordinacion con los requisitos aplicables.',
    'La referencia a RIC N06 debe evaluarse segun el alcance, diseno y condiciones de cada proyecto.',
    'Si necesitas apoyo tecnico para tu instalacion o proyecto, conversemos.',
  ].join(' ');
  const suffix = `\n\nCTA: ${CONTACT_URL}\n\n${HASHTAGS}`;

  return `${trimToLength(body, LINKEDIN_LIMIT - suffix.length)}${suffix}`;
};

export const buildInstagramCaption = (job) => {
  const projectContext = buildProjectContext(job, 90);
  const body = `Nuevo video de Magno Terra: puesta a tierra${projectContext} con foco tecnico y aplicacion responsable en Chile. RIC N06 se evalua segun cada proyecto.`;
  const suffix = `\n\nContacto: ${CONTACT_URL}\n${HASHTAGS}`;

  return `${trimToLength(body, INSTAGRAM_LIMIT - suffix.length)}${suffix}`;
};

const getValidVideos = (payload) => {
  if (!payload || !Array.isArray(payload.videos)) {
    return [];
  }

  return payload.videos
    .map((video) => ({
      url: compactWhitespace(video?.url),
      job: video?.job,
    }))
    .filter((video) => video.url);
};

export const formatYouTubeUploadBatchMarkdown = (payload) => {
  const videos = getValidVideos(payload);

  if (videos.length === 0) {
    return 'NO_VIDEOS';
  }

  return videos
    .map((video, index) => {
      const videoNumber = index + 1;

      return [
        `### Video ${videoNumber}`,
        '',
        '1) URL',
        video.url,
        '',
        '2) Copy LinkedIn empresa',
        buildLinkedInCopy(video.job),
        '',
        '3) Caption Instagram',
        buildInstagramCaption(video.job),
      ].join('\n');
    })
    .join('\n\n---\n\n');
};
