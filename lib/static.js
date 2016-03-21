
/**
 * Module dependencies.
 */

var path = require('path');
var mime = require('mime');
var file = require('./file');
var debug = require('debug')('n8.io:static');

/**
 * Serve a static file from "public".
 */

module.exports = function (req, res, next) {
  var name = req.path;
  var public_path = 'public' + name;
  debug('attempting to serve static file %o', public_path);

  file(public_path)(req, res, function (err) {
    if (err) return next(err);

    var buf = req.files[public_path];
    if (buf) {
      debug('serving static file %o (%s)', public_path, req.sha);
      var type = mime.lookup(path.extname(name));
      var charset = mime.charsets.lookup(type);
      if (charset) type += '; charset="' + charset + '"';
      res.set('Content-Type', type);
      res.set('Content-Length', buf.length);
      res.end(buf);
    } else {
      debug('file does not exist %o (%s)', public_path, req.sha);
      // file not found in this commit
      next();
    }
  });
};
