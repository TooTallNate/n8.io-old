
/**
 * Module exports.
 */

var render = require('./render');
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

  // TODO: get real article
  var article = {
    name: name,
    title: name,
    date: new Date,
    html: '<b>hello world</b>'
  };

  var locals = {
    article: article
  };
  render('views/articles.jade', locals)(req, res, next);
}
