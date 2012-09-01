
/**
 * Module dependencies.
 */

var debug = require('debug')('n8.io:articles');

/**
 * Module exports.
 */

module.exports = articles;

/**
 * Render and serve the "/articles" page for the current commit.
 */

function articles (req, res, next) {
  debug('rendering %j (%s)', req.path, req.sha);

}
