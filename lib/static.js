
/**
 * Module dependencies.
 */

var path = require('path');
var file = require('./file');
var debug = require('debug')('n8.io:static');

/**
 * Serve a static file from "public".
 * TODO: write a streaming interface on top of the "void *" that libgit2 gives us
 */

module.exports = function (req, res, next) {
  var name = req.path;
  var public_path = 'public' + name;
  debug('attempting to serve static file %j', public_path);

  file(public_path)(req, res, function (err) {
    if (err) return next(err);

    var buf = req.files[public_path];
    if (buf) {
      debug('serving static file %j (%s)', public_path, req.sha);
      res.type(path.extname(name));
      res.set('Content-Length', buf.length);
      res.end(buf);
    } else {
      debug('file does not exist %j (%s)', public_path, req.sha);
      // file not found in this commit
      next();
    }
  });
};
