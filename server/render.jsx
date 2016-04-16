import sha from '../sha';
import render from '../layout';
import { url as gravatar } from 'gravatar';
import DEBUG from 'debug';

const debug = DEBUG('n8.io:render');

export default async function (req, res) {
  const avatar = gravatar('nathan@tootallnate.net', { s: 500 });
  const locals = { sha, avatar };

  res.setHeader('Content-Type', 'text/html; charset=utf8');
  return render(locals);
}
