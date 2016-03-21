
/**
 * Module dependencies.
 */

var fs = require('fs');
var ref = require('ref');
var git = require('./git');
var path = require('path');
var LRU = require('lru-cache');
var GitError = require('./git-error');
var debug = require('debug')('n8.io:file');

/**
 * libgit2 "not found" error code.
 */

var GIT_ENOTFOUND = -3;

/**
 * The cache.
 * Keys are in the format "{sha}{filepath}", values are `git_blob` instances.
 */

var cache = LRU({
  max: 1048576, // 1mb worth of Buffers (XXX increase?)
  length: function (v) {
    debug('calculating `git_blob` size', v.raw.length);
    return v.raw.length;
  },
  dispose: function (k, v) {
    debug('disposing cache item %o', k, v);
    git.git_blob_free(v);
  }
});

/**
 * `git_blob **` type.
 */

var git_blob_ptr = ref.refType(git.git_blob);

/**
 * `git_tree **` type.
 */

var git_tree_ptr = ref.refType(git.git_tree);

/**
 * Possibly loads `req.files[filepath]` with the contents of the file at
 * "filepath" from the current `req.sha` commit.
 */

module.exports = file;
function file (filepath) {
  return function (req, res, next) {
    debug('retrieving file %o (%s)', filepath, req.sha);
    if (!req.files) req.files = {};

    if ('/' === filepath[filepath.length - 1]) {
      // we don't serve directories...
      debug('skipping directory path (ends with "/") (%s) %o', req.sha, filepath);
      return next();
    }

    // if the request if for the root "/" without an SHA specified, and we're in
    // "dev" mode, then we can serve from the filesystem instead of git.
    if (req.is_root && !req.app.settings.bare && !req.app.settings.prod) {
      var full_path = path.join(req.app.settings.repo_path, filepath);
      debug('reading file using "fs" module for %j', full_path);
      fs.readFile(full_path, function (err, buf) {
        if (err && err.code != 'ENOENT') {
          return next(err);
        }
        if (buf) {
          req.files[filepath] = buf;
        }
        next();
      });
      return;
    }

    // need to look up the file from the git repo
    var buf, dir_tree, err, repo;
    repo = req.app.settings.repo;
    dir_tree = req.root_tree;

    // check cache when in prod mode
    if (req.app.settings.prod) {
      buf = cache.get(req.sha + filepath);
      if (buf) {
        buf = buf.raw; // get the raw Buffer for the `git_blob` instance
        debug('cache hit for static file (%s) %o %d bytes', req.sha, filepath, buf.length);
        req.files[filepath] = buf;
        return next();
      }
    }

    // get subtree if necessary
    var dirname = path.dirname(filepath);
    if (dirname && dirname !== '.' && dirname !== '/') {
      debug('need to get subtree "git_tree" instance for dir', dirname);
      var pub_tree = ref.alloc(git_tree_ptr);
      err = git.git_tree_get_subtree(pub_tree, req.root_tree, filepath);
      if (err !== 0) {
        if (GIT_ENOTFOUND === err) {
          next();
        } else {
          next(new GitError('git_tree_get_substree', err));
        }
        return;
      }
      dir_tree = pub_tree = pub_tree.deref();
    }

    // get "git_entry" instance
    var filename = path.basename(filepath);
    debug('git_tree_entry_byname(%o)', filename);
    var entry = git.git_tree_entry_byname(dir_tree, filename);
    if (entry.isNull()) {
      debug('git_tree_entry_byname: filepath does not exist for %o (%s)', req.sha, filepath);
      freeTree();
      return next();
    }

    // TODO: ensure that "entry"'s "type" is for "file"

    // turn "git_entry" instance into a "git_blob" instance
    var entry_blob = ref.alloc(git_blob_ptr);
    debug('git_tree_entry_to_object()');
    git.git_tree_entry_to_object.async(entry_blob, repo, entry, onBlob);
    function onBlob (_, err) {
      debug('git_tree_entry_to_object() done');
      if (err !== 0) {
        freeTree();
        return next(new GitError('git_tree_entry_to_object', err));
      }
      entry_blob = entry_blob.deref();

      // get size and raw buffer
      var size = git.git_blob_rawsize(entry_blob);
      entry_blob.raw = buf = git.git_blob_rawcontent(entry_blob).reinterpret(size);

      // cache when in "prod" mode
      if (req.app.settings.prod) {
        debug('setting cache for (%s) %o %d bytes', req.sha, filepath, buf.length);
        cache.set(req.sha + filepath, entry_blob);
      }
      req.files[filepath] = buf;

      next();
      freeTree();
    }

    // free()s the sub `git_tree` instance if one was retrieved
    function freeTree () {
      if (dir_tree != req.root_tree) {
        debug('free()ing sub `git_tree` instance');
        git.git_tree_free(dir_tree);
      }
    }

  };
}
