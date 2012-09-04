
/**
 * Module dependencies.
 */

var url = require('url');
var ref = require('ref');
var git = require('./git');
var debug = require('debug')('n8.io:sha');

/**
 * When an SHA commit was specified.
 */

module.exports = function (req, res, next) {
  var sha = req.params[0];
  var repo = req.app.settings.repo;
  debug('got request for SHA commit', sha);
  req.sha = sha;
  var origUrl = req.url;
  req.url = req.url.substring(sha.length + 1);

  // if the sha is less than 40 chars, then resolve the short SHA
  if (git.OID_HEXSZ != sha.length) {
    debug('need to resolve short SHA', sha);
    var short_oid = ref.alloc(git.git_oid);
    var commit, buf, oid, err, full_sha;

    // turn the sha into a "git_oid" instance
    err = git.git_oid_fromstrn(short_oid, sha, sha.length);
    if (err !== 0) return next(new Error('git_oid_fromstrn: error ' + err));

    // get a "git_commit" instance from the short "git_oid"
    commit = ref.alloc(ref.refType(git.git_commit));
    err = git.git_commit_lookup_prefix(commit, repo, short_oid, sha.length);
    if (err !== 0) return next(new Error('git_commit_lookup_prefix: error ' + err));
    commit = commit.deref();

    // get a new, full "git_oid" instance and format it into a Buffer
    oid = git.git_commit_id(commit);
    buf = new Buffer(git.OID_HEXSZ);
    git.git_oid_fmt(buf, oid);

    // stringify the buffer and redirect
    full_sha = buf.toString('ascii');
    debug('resolved full SHA (%s)', sha, full_sha);
    res.redirect('/' + full_sha + (req.url || '/'));

    // free() the `git_commit` instance
    git.git_commit_free(commit);
    return;
  }

  // only an SHA, no trailing "/" or anything else, redirect to "/{sha}/"
  if (!req.path) {
    debug('no trailing "/", redirecting');
    var parsed = url.parse(origUrl);
    parsed.pathname = '/' + sha + '/';
    return res.redirect(url.format(parsed));
  }

  // got an SHA and it was 40 characters :)
  next();
};
