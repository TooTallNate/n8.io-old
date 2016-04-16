import DEBUG from 'debug';

const debug = DEBUG('n8.io:articles');

export default async function (req, res) {
  let total = 0;
  let articles = [];
  return { total, articles };
}
