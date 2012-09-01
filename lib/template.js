
/**
 * TODO: caching based on sha and filepath
 */

function compile (filepath) {
  return function (req, res, next) {
    debug('compiling Jade template for filepath', filepath);
    if (!req.templates) req.templates = {};
    var raw = req.files[filepath];
    if (!raw) return next(new Error('no data available for: ' + filepath));
    req.templates[filepath] = jade.compile(raw.toString(), {
      filename: filepath
    });
    debug('done compiling Jade template (%s)', filepath);
    next();
  }
}
