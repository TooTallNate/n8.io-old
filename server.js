var fs = require('fs');
var url = require('url');
var ref = require('ref');
var git = require('./git');
var path = require('path');
var jade = require('jade');
var mime = require('mime');
var marked = require('marked');
var express = require('express');

var app = module.exports = express();
var repo_path = __dirname;
var git_path = repo_path + '/.git';
var err;

const OID_RAWSZ = 20;
const OID_HEXSZ = OID_RAWSZ * 2;


// first get the "git_repository" instance for this repo
var repo = ref.alloc(ref.refType(git.git_repository));
err = git.git_repository_open(repo, git_path);
if (err !== 0) {
  throw new Error('git_repository_open: error opening');
}
repo = repo.deref();
var bare = git.git_repository_is_bare(repo);


/**
 * Connect logger.
 */

app.use(express.logger());


/**
 * Relay the node version... why the hell not?
 */

app.use(function (req, res, next) {
  res.set('X-Node-Version', process.version);
  next();
});


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
  res.set('X-Top-Level', 'true');
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
    //git.git_commit_free.async(commit, function () {});
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

  var oid = ref.alloc(git.git_oid);
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
 * Loads "req.files[filepath]" with the contents of the file at "filepath" from
 * the current "req.sha" commit.
 * TODO: caching based on SHA and filepath
 */

function file (filepath) {
  return function (req, res, next) {
    if (!req.files) req.files = {};

    if (req.is_head && !bare) {
      // return from the local filesystem for DEV MODE!!!
      fs.readFile(path.join(repo_path, filepath), function (err, buf) {
        if (err) console.error(err);
        if (buf) req.files[filepath] = buf;
        next();
      });
      return;
    }

    // get subtree if necessary
    var dirname = path.dirname(filepath);
    var dir_tree = req.root_tree;
    if (dirname && dirname !== '.' && dirname !== '/') {
      var pub_tree = ref.alloc(ref.refType(git.git_tree));
      var err = git.git_tree_get_subtree(pub_tree, req.root_tree, filepath)
      if (err !== 0) return next(new Error('git_tree_get_substree: error ' + err));
      dir_tree = pub_tree = pub_tree.deref();
    }

    // get file entry
    var filename = path.basename(filepath);
    var entry = git.git_tree_entry_byname(dir_tree, filename);
    if (entry.isNull()) {
      // requested path does not exist in the "public" dir
      console.error('WARN: requested path does not exist for commit %s %j ', req.sha, filepath);
      //git.git_tree_free.async(pub_tree, function () {}); // free()
      return next();
    }

    req.files[filepath] = entry_to_buffer(entry);

    //git.git_tree_free.async(pub_tree, function () {}); // free()
    next();
  }
}


/**
 * TODO: caching based on sha and filepath
 */

function compile (filepath) {
  return function (req, res, next) {
    if (!req.templates) req.templates = {};
    var raw = req.files[filepath];
    if (!raw) return next(new Error('no data available for: ' + filepath));

    req.templates[filepath] = jade.compile(raw.toString(), {
      filename: filepath
    });
    next();
  }
}

function by_date (a, b) {
  var da = new Date(a.date);
  var db = new Date(b.date);
  return db - da;
}


/**
 * Render the 10 most recent articles listing page.
 */

app.get('/', articles, file('views/layout.jade'), file('views/index.jade'),
compile('views/layout.jade'), compile('views/index.jade'),
function (req, res, next) {
  var layout = req.templates['views/layout.jade'];
  var index = req.templates['views/index.jade'];
  var locals = {};
  locals.sha = req.sha;
  locals.articles = req.articles.sort(by_date);
  locals.versions = process.versions;

  // render the index template
  locals.body = index(locals);

  // render and send the layout template
  res.type('html');
  res.send(layout(locals));
});


/**
 * Render an article.
 */

/*app.get('*', file('views/article.jade'), file('views/layout.jade'),
function (req, res, next) {

});*/


/**
 * Serve a static file from "public".
 * It's too bad libgit2 sucks and doesn't have a streaming interface...
 */

app.get('*', function (req, res, next) {
  var parsed = url.parse(req.url);
  var subtree_path = 'public' + parsed.pathname;

  // TODO: caching or something...
  file(subtree_path)(req, res, function (err) {
    if (err) return next(err);

    if (subtree_path in req.files) {
      res.set('Content-Type', mime.lookup(path.extname(parsed.pathname)));
      res.send(req.files[subtree_path]);
    } else {
      // file not found in this commit
      next();
    }
  });
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
    req.articles = [];
    for (var i = 0; i < count; i++) {
      var entry = git.git_tree_entry_byindex(articles, i);
      var name = git.git_tree_entry_name(entry);
      var is_article = path.extname(name) == '.markdown';
      if (is_article) {
        var article = {};
        req.articles.push(article);
        article.filename = name;
        article.href = name.replace(/\.markdown$/, '');
        article.raw = entry_to_buffer(entry).toString('utf8');
        var split = article.raw.indexOf('\n\n');
        var headers = article.raw.substring(0, split).split('\n');
        article.headers = headers;
        headers.forEach(function (h) {
          var split = h.indexOf(':');
          var name = h.substring(0, split);
          if (h[split + 1] == ' ') split++;
          var val = h.substring(split + 1);
          article[name.toLowerCase()] = val;
        });
        article.html = marked(article.raw.substring(split));

        // the first paragraph
        article.desc = article.html.substring(0, article.html.indexOf('</p>'));
      }
    }
    next();
  }
}

/**
 * Gets a Buffer from a "blob" git_tree_entry.
 */

function entry_to_buffer (entry) {
  // get file contents
  var entry_blob = ref.alloc(ref.refType(git.git_blob));
  err = git.git_tree_entry_to_object(entry_blob, repo, entry);
  if (err !== 0) return next(new Error('git_tree_entry_to_object: error ' + err));
  entry_blob = entry_blob.deref();

  // get size and raw buffer
  var rawsize = git.git_blob_rawsize(entry_blob);
  var rawcontent = git.git_blob_rawcontent(entry_blob).reinterpret(rawsize);
  return rawcontent;
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
