
/**
 * Module dependencies.
 */

var ref = require('ref');
var git = require('./git');
var debug = require('debug')('n8.io:head');

/**
 * In "prod" mode, lookup the HEAD only once and then cache the full SHA as a
 * JavaScript string, the `git_reference *`, and the `git_oid`.
 *
 * (I think the `git_reference *` needs to stick around for the `git_oid` to
 * remain valid. You're supposed to `git_reference_free()` the "head_ref" at some
 * point, but since we're caching indefinitely we're never gonna do that.)
 */

var head_sha;
var head_ref;
var head_oid;

/**
 * Resolve HEAD always. The templates from HEAD are used by default so every
 * request needs "req.head_sha" to be set.
 */

module.exports = function (req, res, next) {
  debug('resolving HEAD');

  function setSha (sha, oid) {
    res.set('X-HEAD-SHA', sha);
    req.head_sha = sha;
    req.head_oid = oid;
    if (!req.sha) {
      debug('got root-level request', req.url);
      req.is_root = true;
      req.sha = sha;
      req.oid = oid;
    }
    next(); // done
  }

  // check the cache first
  if (head_sha) {
    debug('resolved HEAD from cache', head_sha);
    return setSha(head_sha, head_oid);
  }

  // resolve HEAD from the "git_repository" instance
  var buf, err, head, oid, sha;

  // get the "git_reference" instance for the HEAD commit
  head = ref.alloc(ref.refType(git.git_reference));
  err = git.git_repository_head(head, req.app.settings.repo);
  if (err !== 0) {
    return next(new Error('git_repository_head: error ' + rtn));
  }
  head = head.deref();

  // resolve the "git_reference" into a "git_oid" and then format into an SHA
  oid = git.git_reference_oid(head);
  buf = new Buffer(git.OID_HEXSZ);
  git.git_oid_fmt(buf, oid);
  sha = buf.toString('ascii');
  debug('resolved HEAD from git repo', sha);

  if (req.app.settings.prod) {
    // set the cache variables if we're in "prod" mode
    debug('setting HEAD cache variables', sha)
    head_sha = sha;
    head_ref = head;
    head_oid = oid;
  }

  setSha(sha, oid);
};
