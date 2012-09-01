
/**
 * Module dependencies.
 */

var ref = require('ref');
var git = require('./git');
var debug = require('debug')('n8.io:head');

/**
 * In "prod" mode, lookup the HEAD only once and then cache forever.
 */

var head_cache;

/**
 * Resolve HEAD if no SHA was specified.
 */

module.exports = function (req, res, next) {
  if (req.sha) return next();

  function setSha (sha) {
    req.sha = sha;
    req.is_head = true;
    next(); // done
  }

  debug('top-level request: resolving HEAD');
  res.set('X-Top-Level', 'true');

  // check the cache first
  if (head_cache) {
    debug('resolved HEAD from cache', head_cache);
    return setSha(head_cache);
  }

  // resolve HEAD from the "git_repository" instance
  var buf, err, head, head_oid, sha;

  // get the "git_reference" instance for the HEAD commit
  head = ref.alloc(ref.refType(git.git_reference));
  err = git.git_repository_head(head, req.app.settings.repo);
  if (err !== 0) {
    return next(new Error('git_repository_head: error ' + rtn));
  }
  head = head.deref();

  // resolve the "git_reference" into a "git_oid" and then format into an SHA
  head_oid = git.git_reference_oid(head);
  buf = new Buffer(git.OID_HEXSZ);
  git.git_oid_fmt(buf, head_oid);
  sha = buf.toString('ascii');
  debug('resolved HEAD', sha);

  if (req.app.settings.prod) {
    // set the cache if we're in "prod" mode
    debug('setting "head_cache" to HEAD SHA', sha)
    head_cache = sha;
  }

  setSha(sha);
};
