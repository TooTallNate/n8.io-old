
/**
 * Module dependencies.
 */

var file = require('./file');
var LRU = require('lru-cache');
var debug = require('debug')('n8.io:template');

/**
 * Module exports.
 */

module.exports = template;

/**
 * The cache.
 * Keys are "{sha}{filepath}" pairs. Values are the compiled Jade function.
 * Jade compilation was one of the slower operations on the Raspberry Pi so
 * should be a good improvement.
 */

var cache = LRU({
  max: 100, // 100 compiled Jade function instances
  dispose: function (k, v) { debug('disposing cache item %j', k, v); }
});

/**
 * Gets file "filepath" and compiles it into a Jade function.
 * Populates `req.templates[filepath]` with the result.
 */

function template (filepath) {
  return function (req, res, next) {
    debug('getting Jade template for filepath', filepath);
    var template, buf;
    if (!req.templates) req.templates = {};

    // check the cache first in prod mode
    if (req.app.settings.prod) {
      template = cache.get(req.sha + filepath);
      if ('function' == typeof template) {
        debug('cache hit for Jade template (%s) %j', req.sha, filepath);
        req.templates[filepath] = template;
        return next();
      }
    }

    // attempt to populate `req.files[filepath]` first
    file(filepath)(req, res, function (err) {
      if (err) return next(err);

      // ensure file is present
      buf = req.files[filepath];
      if (!buf) {
        return next(new Error('no data available for: ' + filepath));
      }

      // compile!
      template = jade.compile(buf.toString(), {
        filename: filepath
      });
      debug('done compiling Jade template (%s) %j', req.sha, filepath);

      // set cache in prod mode and move on
      if (req.app.settings.prod) {
        debug('setting cache for Jade template (%s) %j', req.sha, filepath);
        cache.set(req.sha + filepath, template);
      }
      req.templates[filepath] = template;
      next();
    });
  }
}
