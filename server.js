var url = require('url');
var ref = require('ref');
var git = require('./git');
var jade = require('jade');
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
    req.is_head = true;
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
  //var short_oid = ref.alloc(git.git_oid);
  var short_oid = new Buffer(OID_HEXSZ + 1); // TODO: use ref.alloc()
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
    git.git_commit_free.async(commit, function () {});
  }
});


/**
 * Populate "req.oid", "req.commit" and "req.root_tree".
 * Also sets the "X-Commit-SHA" header.
 */

app.get('*', function (req, res, next) {
  var commit, tree;
  var sha = req.sha;
  res.set('X-Commit-SHA', sha);

  var oid = new Buffer(OID_HEXSZ + 1); // TODO: use ref.alloc()
  git.git_oid_fromstr.async(oid, sha, onOid);
  function onOid (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_oid_fromstr: error ' + rtn)); // libgit2 error
    req.oid = oid;
    commit = ref.alloc(ref.refType(git.git_commit));
    // TODO: use inline wrapper
    git.git_object_lookup.async(commit, repo, oid, 1, onCommit);
  }
  function onCommit (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_commit_lookup: error ' + rtn)); // libgit2 error
    req.commit = commit = commit.deref();
    tree = ref.alloc(ref.refType(git.git_tree));
    git.git_commit_tree.async(tree, commit, onTree);
  }
  function onTree (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_commit_tree: error ' + rtn)); // libgit2 error
    req.root_tree = tree = tree.deref();
    next();
  }
});


/**
 * Serve the root articles listings page. Top 10 recent articles.
 */

app.get('/', articles, views, function (req, res, next) {
  var locals = {};
  locals.articles = req.articles;
  // TODO: make all of this async

  // First get the contents of "index.jade"
  var index_entry = git.git_tree_entry_byname(req.views_tree, 'index.jade');
  var index_blob = ref.alloc(ref.refType(git.git_blob));
  var err = git.git_tree_entry_to_object(index_blob, repo, index_entry);
  if (err !== 0) {
    return next(new Error('bad'));
  }
  index_blob = index_blob.deref();
  var index_size = git.git_blob_rawsize(index_blob);
  var index_raw = git.git_blob_rawcontent(index_blob).reinterpret(index_size);

  // compile the template
  // TODO: cache when "is_head" is false
  var template = jade.compile(index_raw.toString(), {
    filename: 'views/index.jade'
  });

  // render the template
  var html = template(locals);
  res.set('Content-Type', 'text/html');
  res.send(html);
});


/**
 * Populates "req.articles" with an Array the names of the "articles" for the
 * current commit. Also populates "req.articles_tree" with the "git_tree"
 * instance.
 */

function articles (req, res, next) {
  var root = req.root_tree;
  var articles;
  git.git_tree_entry_byname.async(root, 'articles', onEntry);
  function onEntry (err, articles_entry) {
    if (err) return next(err); // ffi error
    if (articles_entry.isNull()) return next(new Error('"articles" dir does not exist for this commit'));
    articles = ref.alloc(ref.refType(git.git_tree));
    git.git_tree_entry_to_object.async(articles, repo, articles_entry, onTree);
  }
  function onTree (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_tree_entry_to_object: error ' + rtn)); // libgit2 error
    articles = articles.deref();
    req.articles_tree = articles;

    // TODO: make async, I'm being lazy ATM
    var count = git.git_tree_entrycount(articles);
    var map = {};
    for (var i = 0; i < count; i++) {
      var entry = git.git_tree_entry_byindex(articles, i);
      var name = git.git_tree_entry_name(entry).replace(/\.markdown$/, '');
      map[name] = true;
    }
    req.articles = Object.keys(map);
    next();
  }
}


/**
 * Populates "req.views_tree".
 */

function views (req, res, next) {
  var root = req.root_tree;
  var views;
  git.git_tree_entry_byname.async(root, 'views', onEntry);
  function onEntry (err, views_entry) {
    if (err) return next(err); // ffi error
    if (views_entry.isNull()) return next(new Error('"views" dir does not exist for this commit'));
    views = ref.alloc(ref.refType(git.git_tree));
    git.git_tree_entry_to_object.async(views, repo, views_entry, onTree);
  }
  function onTree (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_tree_entry_to_object: error ' + rtn)); // libgit2 error
    req.views_tree = views = views.deref();
    next();
  }
}


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
