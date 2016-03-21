
/**
 * Module dependencies.
 */

var file = require('./file');
var LRU = require('lru-cache');
var markdown = require('./markdown');
var debug = require('debug')('n8.io:article-obj');

/**
 * Module exports.
 */

module.exports = articleObjs;

/**
 * The cache.
 * Keys are "{sha}{name}" pairs. Values are "article object"s.
 */

var cache = LRU({
  max: 50, // "article objects"
  dispose: function (k, v) { debug('disposing cache item %j', k, v); }
});

/**
 * Populates `req.articles[article]` with an "article object".
 * Returns a cached article object in prod mode when possible.
 * An "article object" contains:
 *   - name  - String - Article filename (sans .markdown)
 *   - title - String - Artile full title
 *   - date  - Date   - The publish date of the article
 *   - html  - String - The HTML result of the compiled Markdown
 */

function articleObjs (name) {
  return function (req, res, next) {
    debug('getting "article object" (%s) %j', req.sha, name);
    if (!req.articles) req.articles = {};
    var article;

    // check cache first in prod mode
    if (req.app.settings.prod) {
      article = cache.get(req.sha + name);
      if (article) {
        debug('cache hit for "article object" (%s) %j', req.sha, name);
        req.articles[name] = article;
        return next();
      }
    }

    // need to create and populate an "article object".
    // get the file contents of the .markdown article first.
    var filename = 'articles/' + name + '.markdown';
    file(filename)(req, res, onFile);

    function onFile (err) {
      if (err) return next(err);
      var buf = req.files[filename];
      if (!buf) {
        return next(new Error('no data available for: ' + filepath));
      }

      // now that we have article .markdown contents, we can process it
      article = processArticle(buf.toString('utf8'));
      article.filename = filename;
      article.name = name;
      debug('got "article object" (%s) %j', req.sha, name);

      // set the cache in prod mode and continue
      if (req.app.settings.prod) {
        debug('setting cache for "article object" (%s) %j', req.sha, name);
        cache.set(req.sha + name, article);
      }
      req.articles[name] = article;
      next();
    }

  };
}

/**
 * Process a raw markdown String into an "article object".
 *
 * @api private
 */

var delimiter = '\n\n';

function processArticle (contents) {
  var article = {};
  var split = contents.indexOf(delimiter);
  var headers = contents.substring(0, split).split('\n');

  // parse the headers
  article.headers = headers;
  headers.forEach(function (h) {
    var split = h.indexOf(':');
    var name = h.substring(0, split);
    if (h[split + 1] == ' ') split++;
    var val = h.substring(split + 1);
    article[name.toLowerCase()] = val;
  });

  // turn "date" into a Date instance
  article.date = new Date(article.date);

  // process the markdown into HTML
  article.markdown = contents.substring(split + delimiter.length);
  article.html = markdown(article.markdown);

  // the first paragraph
  article.desc = article.html.substring(0, article.html.indexOf('</p>'));

  return article;
}
