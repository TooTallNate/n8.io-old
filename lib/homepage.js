
/**
 * Module dependencies.
 */

var render = require('./render');
var debug = require('debug')('n8.io:homepage');
var sortedArticles = require('./sorted-articles');

/**
 * Module exports.
 */

module.exports = homepage;

/**
 * Render and serve the homepage for the current commit.
 */

function homepage (req, res, next) {
  debug('rendering homepage (%s)', req.sha);

  // need to get the "sorted_articles" first
  sortedArticles(req, res, function (err) {
    if (err) return next(err);
    var locals = {
      articles: req.sorted_articles
    };
    render('views/index.jade', locals)(req, res, next);
  });
}
