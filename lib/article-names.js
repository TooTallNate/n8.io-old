
/**
 * Module dependencies.
 */

var fs = require('fs');
var ref = require('ref');
var git = require('./git');
var path = require('path');
var LRU = require('lru-cache');
var debug = require('debug')('n8.io:article-names');

/**
 * Module exports.
 */

module.exports = articleNames;

/**
 * The cache.
 * Keys are commit SHAs. Values are Arrays of Strings of valid article names.
 */

var cache = LRU({
  max: 500,
  length: function (v) { return v.length; }, // array length
  dispose: function (k, v) { debug('disposing of cache item %j', k, v); }
});

/**
 * `git_tree **` type.
 */

var git_tree_ptr = ref.refType(git.git_tree);

/**
 * Populates `req.article_names` with an Array of Strings of the names of valid
 * blog articles. An LRU cache is in place so that subsequent requests are cached.
 */

function articleNames (req, res, next) {
  debug('populating `req.article_names`');

  // check the cache first when in prod mode
  var articles;

  // do an fs.readdir when in "dev" mode
  if (req.is_root && !req.app.settings.bare && !req.app.settings.prod) {
    debug('dev: getting articles names using `fs.readdir`');
    var articles_dir = path.join(req.app.settings.repo_path, 'articles');
    fs.readdir(articles_dir, function (err, files) {
      if (err) return next(err);
      req.article_names = files.map(function (f) {
        return f.replace(/\.markdown$/, '');
      });
      next();
    });
    return;
  }

  if (req.app.settings.prod) {
    articles = cache.get(req.sha);
    if (Array.isArray(articles)) {
      debug('cache hit for `req.article_names` for sha', req.sha);
      req.article_names = articles;
      return next();
    }
  }

  // need to fetch article names from the git repo
  var root, articles_tree, repo, err;
  repo = req.app.settings.repo;
  root = req.root_tree;
  articles = [];

  // get the "git_entry" instance for the "articles" dir
  var articles_entry = git.git_tree_entry_byname(root, 'articles');
  if (articles_entry.isNull()) {
    return next(new Error('"articles" dir does not exist for this commit'));
  }

  // get the "git_tree" instance for the "articles" dir
  articles_tree = ref.alloc(git_tree_ptr);
  err = git.git_tree_entry_to_object(articles_tree, repo, articles_entry);
  if (err !== 0) {
    return next(new Error('git_tree_entry_to_object: error ' + err));
  }
  articles_tree = articles_tree.deref();

  // iterate over the "git_entry" instances inside the "articles" dir
  var count = git.git_tree_entrycount(articles_tree);
  for (var i = 0; i < count; i++) {
    var entry = git.git_tree_entry_byindex(articles_tree, i);
    var name = git.git_tree_entry_name(entry);
    articles.push(name.replace(/\.markdown$/, ''));
  }

  // free() the `git_tree` instance for the "articles" dir
  git.git_tree_free(articles_tree);

  // set the cache (in prod mode) and `req.article_names`
  debug('done getting valid article names (%s) %j', req.sha, articles);
  req.article_names = articles;
  if (req.app.settings.prod) {
    debug('setting cache %j', req.sha);
    cache.set(req.sha, articles);
  }
  next();
}
