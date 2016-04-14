import photon from 'photon';
import { url as gravatar } from 'gravatar';
import DEBUG from 'debug';

const debug = DEBUG('n8.io:favicon');

process.name = 'favicon';
process.title = 'GET /favicon';

export default async function (req, res) {
  const img = gravatar('nathan@tootallnate.net', { s: 32 });
  const url = photon(img, { filter: 'grayscale' });

  debug('redirecting %o -> %o', req.url, url);
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}
