
/**
 * Module exports.
 */

var render = require('render');
var debug = require('debug')('n8.io:article');

/**
 * Module exports.
 */

module.exports = article;

/**
 * Render an article.
 */

function article (req, res, next) {

  // is this an article request?
  var name = req.path.substring(1);
  if (!~req.article_names.indexOf(name)) {
    debug('skipping non-article request (%s) %j', req.sha, name);
    return next();
  }

  // render the article and serve it to the client
  debug('rendering article (%s) %j', req.sha, name);

}
