
/**
 * Module exports.
 */

var render = require('./render');
var articleObj = require('./article-obj');
var debug = require('debug')('n8.io:article');

/**
 * Module exports.
 */

module.exports = article;

/**
 * Check if the request was for a blog article by searching the "article_names".
 * Render an article if it is good.
 */

function article (req, res, next) {
  // is this an article request?
  var name = req.path.substring(1);
  if (!~req.article_names.indexOf(name)) {
    debug('skipping non-article request (%s) %j', req.sha, name);
    return next();
  }

  // render the article and serve it to the client
  debug('got article request (%s) %j', req.sha, name);

  // need to get the "article object" first
  articleObj(name)(req, res, onArticle);

  function onArticle (err) {
    if (err) return next(err);
    var locals = {
      article: req.articles[name]
    };
    render('views/article.jade', locals)(req, res, next);
  }
}
