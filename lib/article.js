
/**
 * Module exports.
 */

var debug = require('debug')('n8.io:article');

module.exports = article;

function article (req, res, next) {

  // is this an article request?
  var name = req.path.substring(1);
  if (!~req.article_names.indexOf(name)) {
    debug('skipping non-article request (%s) %j', req.sha, name);
    return next();
  }

}
