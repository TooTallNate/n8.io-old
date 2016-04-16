import render from '../layout';
import DEBUG from 'debug';

const debug = DEBUG('n8.io:render');

export default async function (req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  return render({ sha: '' });
}
