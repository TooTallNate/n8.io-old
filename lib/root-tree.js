
/**
 * Module dependencies.
 */

var ref = require('ref');
var git = require('./git');
var GitError = require('./git-error');
var debug = require('debug')('n8.io:root-tree');

/**
 * Populates "req.root_tree".
 * Also sets the "X-Commit-SHA" header.
 */

module.exports = function (req, res, next) {
  function freeTree () {
    debug('free()ing `git_tree` instance');
    git.git_tree_free(tree);
  }

  var commit, tree, sha, oid, err;
  sha = req.sha;
  res.set('X-Commit-SHA', sha);
  debug('getting "git_tree" instance for the root dir of commit', sha);

  // get the `git_oid` instance if necessary
  oid = req.oid;
  if (!oid) {
    debug('`req.oid` not set - retrieving %j `git_oid` instance', sha);
    oid = ref.alloc(git.git_oid);
    err = git.git_oid_fromstr(oid, sha);
    if (err !== 0) return next(new GitError('git_oid_fromstr', err));
    req.oid = oid;
  }

  // now we must get the `git_commit *` instance for the SHA
  commit = ref.alloc(ref.refType(git.git_commit));
  err = git.git_commit_lookup(commit, req.app.settings.repo, oid);
  if (err !== 0) return next(new GitError('git_commit_lookup', err));
  commit = commit.deref();

  // now we must get the root `git_tree *` instance from the git_commit
  tree = ref.alloc(ref.refType(git.git_tree));
  err = git.git_commit_tree(tree, commit);
  if (err !== 0) return next(new GitError('git_commit_tree', err));
  debug('created "git_tree" instance successfully');
  req.root_tree = tree = tree.deref();

  // don't forget to clean up the `git_tree` instance once the request finishes
  res.on('finish', freeTree);

  next();

  // free() the `git_commit *` instance
  git.git_commit_free(commit);
};
