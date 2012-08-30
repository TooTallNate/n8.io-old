
/**
 * Module dependencies.
 */

var fs = require('fs');
var url = require('url');
var ref = require('ref');
var git = require('./git');
var path = require('path');
var jade = require('jade');
var mime = require('mime');
var marked = require('marked');
var hljs = require('highlight.js');
var express = require('express');
var gravatar = require('gravatar').url;
var debug = require('debug')('n8.io');

/**
 * The app.
 */

var app = module.exports = express();

/**
 * Running in "production" mode?
 *   - Don't serve from "fs", lookup HEAD instead and use that SHA (cache)
 */

var prod = /^production$/i.test(app.settings.env);
debug('running in %j mode%s', app.settings.env, prod ? ' (prod) ' : '');

/**
 * The repo to use.
 */

var repo_path = __dirname;
var git_path = repo_path + '/.git';

const OID_RAWSZ = 20;
const OID_HEXSZ = OID_RAWSZ * 2;


// first get the "git_repository" instance for this repo
var repo = ref.alloc(ref.refType(git.git_repository));
debug('creating "git_repository" instance for repo', git_path);
var err = git.git_repository_open(repo, git_path);
if (err !== 0) {
  throw new Error('git_repository_open: error opening');
}
debug('successfully create "git_repository" instance');
repo = repo.deref();
var bare = git.git_repository_is_bare(repo);


/**
 * Connect logger.
 */

app.use(express.logger('dev'));


/**
 * When an SHA commit was specified.
 */

app.get(/^\/([0-9a-f]{5,40})\b/, function (req, res, next) {
  var sha = req.params[0];
  debug('got request for SHA commit', sha);
  req.sha = sha;
  var origUrl = req.url;
  req.url = req.url.substring(sha.length + 1);
  if (!req.path) {
    // only an SHA, no trailing "/" or anything else, redirect to "/{sha}/"
    debug('no trailing "/", redirecting');
    var parsed = url.parse(origUrl);
    parsed.pathname = '/' + sha + '/';
    return res.redirect(url.format(parsed));
  }
  next();
});


/**
 * Resolve HEAD if no SHA was specified.
 */

var head_cache;
app.get('*', function (req, res, next) {
  if (req.sha) return next();
  debug('top-level request: resolving HEAD');
  if (head_cache) {
    debug('resolved HEAD from cache', head_cache);
    return setSha(head_cache);
  }
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
    var sha = buf.toString('ascii');
    debug('resolved HEAD', sha);
    if (prod) {
      debug('setting "head_cache" to HEAD SHA', sha)
      head_cache = sha;
    }
    setSha(sha);
  }
  function setSha (sha) {
    req.sha = sha;
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
  debug('need to resolve short SHA', sha);
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
    debug('resolved full SHA (%s)', sha, full_sha);
    res.redirect('/' + full_sha + req.url);
    //git.git_commit_free.async(commit, function () {});
  }
});


/**
 * Populates "req.root_tree".
 * Also sets the "X-Commit-SHA" header.
 */

app.get('*', function (req, res, next) {
  var commit, tree;
  var sha = req.sha;
  res.set('X-Commit-SHA', sha);

  var oid = ref.alloc(git.git_oid);
  debug('getting "git_tree" instance for the root dir of commit', sha);
  git.git_oid_fromstr.async(oid, sha, onOid);
  function onOid (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_oid_fromstr: error ' + rtn)); // libgit2 error
    commit = ref.alloc(ref.refType(git.git_commit));
    // TODO: use inline wrapper
    git.git_object_lookup.async(commit, repo, oid, 1, onCommit);
  }
  function onCommit (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_commit_lookup: error ' + rtn)); // libgit2 error
    commit = commit.deref();
    tree = ref.alloc(ref.refType(git.git_tree));
    git.git_commit_tree.async(tree, commit, onTree);
  }
  function onTree (err, rtn) {
    if (err) return next(err); // ffi error
    if (rtn !== 0) return next(new Error('git_commit_tree: error ' + rtn)); // libgit2 error
    debug('created "git_tree" instance successfully');
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
    debug('retrieving file %j (%s)', filepath, req.sha);
    if (!req.files) req.files = {};

    if (req.is_head && !bare && !prod) {
      // return from the local filesystem for DEV MODE!!!
      debug('reading file using "fs" module for %j', filepath);
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
      debug('need to get subtree "git_tree" instance for dir', dirname);
      var pub_tree = ref.alloc(ref.refType(git.git_tree));
      var err = git.git_tree_get_subtree(pub_tree, req.root_tree, filepath);
      if (err !== 0) return next(new Error('git_tree_get_substree: error ' + err));
      dir_tree = pub_tree = pub_tree.deref();
    }

    // get file entry
    var filename = path.basename(filepath);
    debug('getting "git_tree_entry" for file', filename);
    var entry = git.git_tree_entry_byname(dir_tree, filename);
    if (entry.isNull()) {
      debug('filepath does not exist for %j (%s)', req.sha, filepath);
      //git.git_tree_free.async(pub_tree, function () {}); // free()
      return next();
    }
    debug('successfully got "git_tree_entry" instance for file', filename);

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
  debug('rendering "/" route');
  var layout = req.templates['views/layout.jade'];
  var index = req.templates['views/index.jade'];

  // TODO: consolidate this rendering logic with the articles page
  var locals = {};
  locals.sha = req.sha;
  locals.versions = process.versions;
  locals.articles = req.articles.sort(by_date);
  locals.avatar = gravatar('nathan@tootallnate.net', { s: 500 });

  // render the index template
  locals.body = index(locals);

  // render and send the layout template
  res.type('html');
  res.send(layout(locals));
  debug('sending "/" route result HTML');
});


/**
 * Render an article.
 * TODO: don't use "articles", just get the valid names
 */

app.get('*', articles, file('views/article.jade'), file('views/layout.jade'),
compile('views/article.jade'), compile('views/layout.jade'),
function (req, res, next) {
  var valid = req.articles.map(function (a) { return a.name; });
  var name = req.path.substring(1);
  if (!~valid.indexOf(name)) return next();
  debug('rendering article "%s" route', name);

  var layout = req.templates['views/layout.jade'];
  var article = req.templates['views/article.jade'];
  var locals = {};
  locals.sha = req.sha;
  locals.versions = process.versions;
  locals.avatar = gravatar('nathan@tootallnate.net', { s: 500 });
  locals.article = req.articles.filter(function (a) { return a.name == name })[0];

  // render the article template
  locals.body = article(locals);

  // render and send the layout template
  res.type('html');
  res.send(layout(locals));
  debug('sending "/%s" route result HTML');
});


/**
 * Serve a static file from "public".
 * TODO: write a streaming interface on top of the "void *" that libgit2 gives us
 */

app.get('*', function (req, res, next) {
  var name = req.path;
  var subtree_path = 'public' + name;
  debug('attempting to serve static file %j', subtree_path);

  file(subtree_path)(req, res, function (err) {
    if (err) return next(err);

    if (subtree_path in req.files) {
      debug('serving static file %j (%s)', subtree_path, req.sha);
      res.type(path.extname(name));
      res.send(req.files[subtree_path]);
    } else {
      debug('file does not exist %j (%s)', subtree_path, req.sha);
      // file not found in this commit
      next();
    }
  });
});


/**
 * Populates "req.articles" with an Array the names of the "articles" for the
 * current commit.
 */

function articles (req, res, next) {
  debug('populating "req.articles"');
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

    // TODO: make async, I'm being lazy ATM
    var count = git.git_tree_entrycount(articles);
    req.articles = [];
    for (var i = 0; i < count; i++) {
      var entry = git.git_tree_entry_byindex(articles, i);
      var name = git.git_tree_entry_name(entry);
      var is_article = path.extname(name) == '.markdown';
      if (is_article) {
        debug('populating "req.articles[%d]" with %j', req.articles.length, name);
        var article = {};
        req.articles.push(article);
        article.filename = name;
        article.name = name.replace(/\.markdown$/, '');
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
        article.html = markdown(article.raw.substring(split));

        // the first paragraph
        article.desc = article.html.substring(0, article.html.indexOf('</p>'));
      } else {
        debug('skipping %j since it doesn\'t end with ".markdown"', name);
      }
    }
    debug('done populating "req.articles"');
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
  if (err !== 0) throw new Error('git_tree_entry_to_object: error ' + err);
  entry_blob = entry_blob.deref();

  // get size and raw buffer
  var rawsize = git.git_blob_rawsize(entry_blob);
  var rawcontent = git.git_blob_rawcontent(entry_blob).reinterpret(rawsize);
  return rawcontent;
}


/**
 * Parses Markdown into highlighted HTML.
 */

function markdown (code) {
  if (!code) return code;
  return marked(code, {
    gfm: true,
    highlight: highlight
  });
}


/**
 * Add syntax highlighting HTML to the given `code` block.
 * `lang` defaults to "javascript" if no valid name is given.
 */

function highlight (code, lang) {
  if (lang) {
    return hljs.highlight(lang, code).value;
  } else {
    return hljs.highlightAuto(code).value;
    //return code;
  }
}
