var url = require('url');
var ref = require('ref');
var git = require('./git');
var express = require('express');

var app = module.exports = express();
var repo_path = __dirname + '/.git';
var err;

const OID_RAWSZ = 20;
const OID_HEXSZ = OID_RAWSZ * 2;


// first get the "git_repository" instance for this repo
var repo = ref.alloc(ref.refType(git.git_repository));
err = git.git_repository_open(repo, repo_path);
if (err !== 0) {
  throw new Error('git_repository_open: error opening');
}
repo = repo.deref();


/**
 * Connect logger.
 */

app.use(express.logger());


/**
 * When an SHA commit was specified.
 */

app.get(/^\/([0-9a-f]{5,40})\b/, function (req, res, next) {
  var sha = req.params[0];
  req.sha = sha;
  var origUrl = req.url;
  req.url = req.url.substring(sha.length + 1);
  if (!req.path) {
    // only an SHA, no trailing "/" or anything else, redirect to "/"
    var parsed = url.parse(origUrl);
    return res.redirect('/' + sha + '/' + (parsed.query ? '?' + parsed.query : ''));
  }
  next();
});


/**
 * Resolve HEAD if no SHA was specified.
 */

app.get('*', function (req, res, next) {
  if (req.sha) return next();
  // we must populate "req.sha" with the sha of HEAD
  // TODO: cache probably...
  var buf; // SHA
  var head = ref.alloc(ref.refType(git.git_repository));
  git.git_repository_head.async(head, repo, onHead);
  function onHead (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_repository_head: error ' + rtn)); // libgit2 error
    head = head.deref();
    git.git_reference_oid.async(head, onOid);
  }
  function onOid (err, head_oid) {
    if (err) return next(err); // ffi error
    buf = new Buffer(OID_HEXSZ);
    git.git_oid_fmt.async(buf, head_oid, onSha);
  }
  function onSha (err) {
    if (err) return next(err); // ffi error
    req.sha = buf.toString('ascii');
    next(); // done
  }
});


/**
 * Resolve the short SHA if a short one was given.
 */

app.get('*', function (req, res, next) {
  var sha = req.sha;
  if ('string' != typeof sha) return next(new Error('No SHA. This SHOULD NOT HAPPEN!'));
  if (OID_HEXSZ == sha.length) return next(); // SHA is good already
  // need to resolve the short SHA and then redirect
  var short_oid = ref.alloc(git.git_oid);
  var commit, buf, oid;
  git.git_oid_fromstrn.async(short_oid, sha, sha.length, onOid);
  function onOid (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_oid_fromstrn: error ' + rtn)); // libgit2 error
    commit = ref.alloc(ref.refType(git.git_commit));
    // TODO: use inline wrapper
    git.git_object_lookup_prefix.async(commit, repo, short_oid, sha.length, 1, onCommit);
  }
  function onCommit (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_commit_lookup_prefix: error ' + rtn)); // libgit2 error
    commit = commit.deref();
    git.git_commit_id.async(commit, onCommitId);
  }
  function onCommitId (err, _oid) {
    if (err) return next(err); // ffi error
    buf = new Buffer(OID_HEXSZ);
    oid = _oid;
    git.git_oid_fmt.async(buf, oid, onSha);
  }
  function onSha (err) {
    if (err) return next(err); // ffi error
    var full_sha = buf.toString('ascii');
    res.redirect('/' + full_sha + req.url);
  }
});


/**
 * Serve the specified path from the specified SHA commit.
 */

app.get('*', function (req, res, next) {
  var sha = req.sha;
  var path = req.path;
  res.end("Serving \"" + path + "\" from commit " + sha + "\n");
});


/**
 * Listen?
 */

if (!module.parent) {
  // If this module is being invoked directly, then
  // fire up the server on the given port.
  var http = require('http');
  var port = parseInt(process.env.N8_IO_PORT, 10) || 3000;
  http.createServer(app).listen(port, function () {
    console.log('TooTallNate.net dev server listening:', this.address());
  });
}
