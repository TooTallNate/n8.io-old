/**
 * Module dependencies.
 */

var debug = require('debug')('n8.io:articles-json');
var sortedArticles = require('./sorted-articles');

/**
 * Module exports.
 */

module.exports = articles;

/**
 * Render and serve the "/articles.json" page for the current commit.
 */

function articles (req, res, next) {
  debug('rendering JSON %j (%s)', req.path, req.sha);

  // need to get the "sorted_articles" first
  sortedArticles(req, res, function (err) {
    if (err) return next(err);
    var articles = req.sorted_articles;
    var total = articles.length;

    // get the "page" selection
    var start = parseInt(req.query.start, 10) || 0;
    var count = parseInt(req.query.count, 10) || articles.length;
    articles = articles.slice(start, start + count);

    var slug = req.query.slug;
    if (slug) {
      articles = articles.filter(function (article) {
        return slug === article.name;
      });
    }

    var last = articles[0];
    res.json({
      total: total,
      articles: articles
    });
  });
}
