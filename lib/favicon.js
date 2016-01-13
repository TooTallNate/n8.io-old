
/**
 * Module dependencies.
 */

var photon = require('photon');
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
  var img = gravatar('nathan@tootallnate.net', { s: 32 });
  var url = photon(img, { filter: 'grayscale' });
  debug('serving "/favicon.ico" -> %o', url);
  res.redirect(url);
}
