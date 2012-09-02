
/**
 * Module dependencies.
 */

var template = require('./template');
var strftime = require('strftime');
var gravatar = require('gravatar').url;
var debug = require('debug')('n8.io:render');
var get_layout = template('views/layout.jade');

/**
 * Module exports.
 */

module.exports = render;

/**
 * Renders a Jade file and sends the response to the client.
 *  - needs to get the "filepath" template
 *  - needs to get the "views/layout.jade" layout template
 *  - needs to render the contents and send back to the HTTP request
 */

function render (filepath, locals) {
  return function (req, res, next) {
    debug('rendering template (%s) %j', req.sha, filepath);
    var body, layout;

    // ensure "filepath" template is loaded
    template(filepath)(req, res, onFilepath);

    function onFilepath (err) {
      if (err) return next(err);
      debug('have %j template (%s)', filepath, req.sha);
      body = req.templates[filepath];
      get_layout(req, res, onLayout);
    }

    function onLayout (err) {
      if (err) return next(err);
      debug('have "views/layout.jade" template (%s)', req.sha);
      layout = req.templates['views/layout.jade'];

      // set up some common locals
      if (!locals) locals = {};
      locals.sha = req.sha;
      locals.strftime = strftime.strftimeUTC;
      locals.versions = process.versions;
      locals.avatar = gravatar('nathan@tootallnate.net', { s: 500 });

      // render the "body" template
      locals.body = body(locals);

      // render the "layout" template and flush to client
      debug('sending %j route result HTML', req.path);
      res.type('html');
      res.send(layout(locals));
    }
  }
}
