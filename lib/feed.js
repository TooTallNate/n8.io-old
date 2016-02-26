
/**
 * Module dependencies.
 */

var url = require('url');
var Feed = require('feed');
var strftime = require('strftime').utc();
var debug = require('debug')('n8.io:feed');
var sortedArticles = require('./sorted-articles');

/**
 * Module exports.
 */

module.exports = atomFeed;

/**
 * Serves the "GET /favicon.ico" route.
 */

function atomFeed(req, res, next) {

  // need to get the "sorted_articles" first
  sortedArticles(req, res, function (err) {
    if (err) return next(err);

    var author = {
      name:    'Nathan Rajlich',
      email:   'nathan@tootallnate.net',
      link:    'https://n8.io'
    };

    var feed = new Feed({
      title:       'n8.io',
      description: 'TooTallNate\'s Personal Blog',
      link:        'https://n8.io',
      image:       'https://n8.io/favicon.ico',
      copyright:   'All rights reserved 2016',
      updated:     req.sorted_articles[0].date,
      author:      author,
      id:          'https://n8.io/feed.xml'
    });

    req.sorted_articles.forEach(function (article) {
      var link = 'https://n8.io/' + article.name;
      feed.addItem({
        id:             tag(link, article.date),
        title:          article.title,
        link:           link,
        description:    article.desc,
        content:        article.html,
        author:         [ author ],
        contributor:    [],
        date:           article.date,
        //image:          article.image
      });
    });

    // XXX: I think ideally we'd be using "application/atom+xml" here,
    // but FF doesn't like that: http://www.petefreitag.com/item/381.cfm
    res.set('Content-Type', 'text/xml;charset=UTF-8');

    var xml = feed.render('atom-1.0');
    res.send(xml);
  });
}

/**
 * Creates a "tag:" URI from the given URL and publish date:
 *
 *   1. Discard everything before the domain name
 *   2. Change all `#` characters to `/`
 *   3. Immediately after the domain name, insert a comma, then the year-month-day
 *      that the article was published, then a colon
 *   4. Add `tag:` at the beginning
 *
 * See: http://goo.gl/0XqWTu
 */

function tag(link, date) {
  var parsed = url.parse(link);
  var path = parsed.pathname;
  if (parsed.hash) path += parsed.hash.replace(/\#/g, '/');
  return 'tag:' + parsed.host + ',' + strftime('%Y-%m-%d', date) + ':' + path;
}
