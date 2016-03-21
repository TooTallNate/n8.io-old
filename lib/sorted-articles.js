
/**
 * Module dependencies.
 */

var articleObj = require('./article-obj');
var debug = require('debug')('n8.io:sorted-articles');

/**
 * Module exports.
 */

module.exports = sortedArticles;

/**
 * Populates `req.sorted_articles` with the Array of sorted "article objects"
 * based on their "date" property.
 */

function sortedArticles (req, res, next) {
  debug('populating `req.sorted_articles` (%o)', req.sha);
  var names = req.article_names;
  var pos = 0;
  var articles = [];
  nextArticle();

  function nextArticle () {
    var name = names[pos++];
    if (!name) return sort();
    debug('getting "article object" for next article', name);
    articleObj(name)(req, res, function (err) {
      if (err) return next(err);
      articles.push(req.articles[name]);
      nextArticle();
    });
  }

  function sort () {
    debug('sorting array of %o "article objects" by their "date"', articles.length);
    req.sorted_articles = articles.sort(by_date);
    next();
  }
}

/**
 * Sort 2 objects by their "date" properties.
 */

function by_date (a, b) {
  return b.date - a.date;
}
