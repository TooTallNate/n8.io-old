
/**
 * Module dependencies.
 */

var gravatar = require('gravatar').url;
var debug = require('debug')('n8.io:favicon');

/**
 * Module exports.
 */

module.exports = favicon;

/**
 * Serves the "GET /favicon.ico" route.
 */

function favicon(req, res, next) {
  var url = gravatar('nathan@tootallnate.net', { s: 500 });
  debug('serving "/favicon.ico" -> %j', url);
  res.redirect(url);
}
