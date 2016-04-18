import { parse } from 'url';
import { resolve } from 'path';
import { readdir, readFile } from '../lib/fs';
import markdown from '../lib/markdown';
import DEBUG from 'debug';

const debug = DEBUG('n8.io:articles');

const articlesDir = resolve(__dirname, '..', 'articles');

export default async function (req, res) {
  const query = parse(req.url, true).query;
  debug('query: %o', query);

  const names = await getArticleNames();
  const total = names.length;

  let articles;

  // a single article was requested
  const slug = query.slug;
  if (slug) {
    try {
      articles = [ await getArticleBySlug(slug) ];
    } catch (e) {
      articles = [];
    }
    return { total, articles };
  }

  articles = await getSortedArticles();

  // get the "page" selection
  const start = parseInt(query.start, 10) || 0;
  const count = parseInt(query.count, 10) || articles.length;
  articles = articles.slice(start, start + count);

  return { total, articles };
}


async function getArticleNames () {
  debug('getArticleNames()');

  const files = await readdir(articlesDir);
  const names = files.map((f) => f.replace(/\.markdown$/, ''));
  return names;
}


async function getArticleBySlug (slug) {
  debug('getArticleBySlug(%o)', slug);

  const filename = resolve(articlesDir, slug + '.markdown');
  let contents = await readFile(filename, 'utf8');

  let article = processArticle(contents);
  article.name = slug;
  return article;
}


async function getSortedArticles () {
  debug('getSortedArticles()');

  const names = await getArticleNames();

  let articles = await Promise.all(names.map((slug) => getArticleBySlug(slug)));

  debug('sorting array of %o "article objects" by their "date"', articles.length);
  return articles.sort(byDate);
}

/**
 * Sort 2 objects by their "date" Date instances.
 */

function byDate (a, b) {
  return b.date - a.date;
}

/**
 * Process a raw markdown String into an "article object".
 *
 * @api private
 */

const delimiter = '\n\n';

function processArticle (contents) {
  const article = {};
  const split = contents.indexOf(delimiter);
  const headers = contents.substring(0, split).split('\n');

  // parse the headers
  article.headers = headers;
  headers.forEach(function (h) {
    let split = h.indexOf(':');
    const name = h.substring(0, split);
    if (h[split + 1] == ' ') split++;
    const val = h.substring(split + 1);
    article[name.toLowerCase()] = val;
  });

  // turn "date" into a Date instance
  article.date = new Date(article.date);

  // process the markdown into HTML
  article.markdown = contents.substring(split + delimiter.length);
  article.html = markdown(article.markdown);

  // the first paragraph
  article.preview = article.html.substring(0, article.html.indexOf('</p>'));

  return article;
}
