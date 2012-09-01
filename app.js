
/**
 * Module dependencies.
 */

var ref = require('ref');
var path = require('path');
var git = require('./lib/git');
var express = require('express');
var debug = require('debug')('n8.io');

/**
 * The app.
 */

var app = module.exports = express();

/**
 * Running in "production" mode?
 *   - Don't serve from "fs", lookup HEAD instead and use that SHA (cache)
 */

var prod = app.settings.prod = /^production$/i.test(app.settings.env);
debug('running in %j mode%s', app.settings.env, prod ? ' (prod) ' : '');

/**
 * The repo to use.
 */

var repo_path = app.settings.repo_path = __dirname;
var git_path = app.settings.git_path = repo_path + '/.git';

/**
 * Load the the "git_repository" instance for this repo.
 */

var repo = ref.alloc(ref.refType(git.git_repository));
debug('creating "git_repository" instance for repo', git_path);
var err = git.git_repository_open(repo, git_path);
if (err !== 0) throw new Error('git_repository_open: error ' + err);
debug('successfully create "git_repository" instance');
repo = app.settings.repo = repo.deref();
var bare = app.settings.bare = git.git_repository_is_bare(repo);


/**
 * Connect logger.
 */

app.use(express.logger('dev'));


/**
 * Routes.
 */

// first we need to figure out which commit SHA we will use
app.get(/^\/([0-9a-f]{5,40})\b/, require('./lib/sha'));
app.get('*', require('./lib/head'));

// by now `req.sha` is guaranteed to be set
app.get('*', require('./lib/root-tree'));

// by now `req.root_tree` is a "git_tree" instance to the resolved SHA
app.get('/', require('./lib/homepage'));
app.get('/articles', require('./lib/articles'));

// attempt to render an article if this a request for one
app.get('*', require('./lib/article-names'));
app.get('*', require('./lib/article'));

// finally attempt to serve static files from the public/ dir
app.get('*', require('./lib/static'));


/**
 * Sort 2 objects by their "date" properties.
 */

function by_date (a, b) {
  var da = new Date(a.date);
  var db = new Date(b.date);
  return db - da;
}


/**
 * Render the homepage.
 */

/*
app.get('/', articles, file('views/layout.jade'), file('views/index.jade'),
compile('views/layout.jade'), compile('views/index.jade'),
function (req, res, next) {
  debug('rendering "/" route');
  var layout = req.templates['views/layout.jade'];
  var index = req.templates['views/index.jade'];

  // TODO: consolidate this rendering logic with the articles page
  var locals = {};
  locals.months = months;
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
*/


/**
 * Render an article.
 * TODO: don't use "articles", just get the valid names
 */

/*
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
  locals.months = months;
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
*/


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
