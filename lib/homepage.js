
/**
 * Module dependencies.
 */

var debug = require('debug')('n8.io:homepage');

/**
 * Module exports.
 */

module.exports = homepage;

/**
 * Render and serve the homepage for the current commit.
 */

function homepage (req, res, next) {
  debug('rendering homepage (%s)', req.sha);

}
