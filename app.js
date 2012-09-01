
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
debug('running in %j mode (prod: %s)', app.settings.env, prod);

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

if (prod) {
  app.use(express.logger());
} else {
  app.use(express.logger('dev'));
}


/**
 * Routes.
 */

// first we need to figure out which commit SHA we will use
app.get(/^\/([0-9a-f]{5,40})\b/, require('./lib/sha'));
app.get('*', require('./lib/head'));

// by now `req.sha` is guaranteed to be set
app.get('*', require('./lib/root-tree'));

// `req.article_names` is used by every request
app.get('*', require('./lib/article-names'));

// by now `req.root_tree` is a "git_tree" instance to the resolved SHA
app.get('/', require('./lib/homepage'));
app.get('/articles', require('./lib/articles'));

// attempt to render an article if this a request for one
app.get('*', require('./lib/article'));

// finally attempt to serve static files from the public/ dir
app.get('*', require('./lib/static'));
