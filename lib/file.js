
/**
 * Module dependencies.
 */

var fs = require('fs');
var ref = require('ref');
var git = require('./git');
var path = require('path');
var LRU = require('lru-cache');
var debug = require('debug')('n8.io:file');

/**
 * The cache.
 * Keys are in the format "{sha}{filepath}", values are Buffers to files...
 */

var cache = LRU({
  max: 1048576, // 1mb worth of Buffers (XXX increase?)
  length: function (v) { return v.length; }, // buffer length
  dispose: function (k, v) { debug('disposing cache item %j', k, v); }
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
    debug('retrieving file %j (%s)', filepath, req.sha);
    if (!req.files) req.files = {};

    if ('/' === filepath[filepath.length - 1]) {
      // we don't serve directories...
      debug('skipping directory path (ends with "/") (%s) %j', req.sha, filepath);
      return next();
    }

    // if the request if for the root "/" without an SHA specified, and we're in
    // "dev" mode, then we can serve from the filesystem instead of git.
    if (req.is_head && !req.app.settings.bare && !req.app.settings.prod) {
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
        debug('cache hit for static file (%s) %j %d bytes', req.sha, filepath, buf.length);
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
        return next(new Error('git_tree_get_substree: error ' + err));
      }
      dir_tree = pub_tree = pub_tree.deref();
    }

    // get "git_entry" instance
    var filename = path.basename(filepath);
    debug('git_tree_entry_byname(%j)', filename);
    var entry = git.git_tree_entry_byname(dir_tree, filename);
    if (entry.isNull()) {
      debug('git_tree_entry_byname: filepath does not exist for %j (%s)', req.sha, filepath);
      // TODO: free() any memory here?
      //git.git_tree_free.async(pub_tree, function () {}); // free()
      return next();
    }

    // TODO: ensure that "entry"'s "type" is for "file"

    // turn "git_entry" instance into a "git_blob" instance
    var entry_blob = ref.alloc(git_blob_ptr);
    debug('git_tree_entry_to_object()');
    err = git.git_tree_entry_to_object(entry_blob, repo, entry);
    debug('git_tree_entry_to_object() done');
    if (err !== 0) {
      return next(new Error('git_tree_entry_to_object: error ' + err));
    }
    entry_blob = entry_blob.deref();

    // get size and raw buffer
    var size = git.git_blob_rawsize(entry_blob);
    buf = git.git_blob_rawcontent(entry_blob).reinterpret(size);

    if (req.app.settings.prod) {
      debug('setting cache for (%s) %j %d bytes', req.sha, filepath, buf.length);
      cache.set(req.sha + filepath, buf);
    }
    req.files[filepath] = buf;

    // TODO: free() any memory here?
    //git.git_tree_free.async(pub_tree, function () {}); // free()
    next();
  }
}
