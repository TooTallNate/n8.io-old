
/**
 * Module dependencies.
 */

var render = require('./render');
var debug = require('debug')('n8.io:articles');
var sortedArticles = require('./sorted-articles');

/**
 * Module exports.
 */

module.exports = articles;

/**
 * Render and serve the "/articles" page for the current commit.
 */

function articles (req, res, next) {
  debug('rendering %j (%s)', req.path, req.sha);

  // need to get the "sorted_articles" first
  sortedArticles(req, res, function (err) {
    if (err) return next(err);
    var locals = {
      articles: req.sorted_articles
    };
    render('views/articles.jade', locals)(req, res, next);
  });
}
