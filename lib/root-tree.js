
/**
 * Module dependencies.
 */

var ref = require('ref');
var git = require('./git');
var debug = require('debug')('n8.io:root-tree');

/**
 * Populates "req.root_tree".
 * Also sets the "X-Commit-SHA" header.
 */

module.exports = function (req, res, next) {
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
    git.git_object_lookup.async(commit, req.app.settings.repo, oid, 1, onCommit);
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
};
