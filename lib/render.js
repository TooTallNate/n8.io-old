
/**
 * Module dependencies.
 */

var template = require('./template');
var debug = require('debug')('n8.io:render');

/**
 * Module exports.
 */

module.exports = render;

/**
 * Renders a Jade file and sends the response to the client.
 */

function render (filepath, locals) {
  return function (req, res, next) {
    return next(new Error('implement me'));
  }
}
