/** Deployment tier — used by blocks that behave differently in authoring vs production */
const ENV =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'dev'
    : 'prod';

export default ENV;
