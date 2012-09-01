
/**
 * Loads "req.files[filepath]" with the contents of the file at "filepath" from
 * the current "req.sha" commit.
 * TODO: caching based on SHA and filepath
 */

module.exports = file;
function file (filepath) {
  return function (req, res, next) {
    debug('retrieving file %j (%s)', filepath, req.sha);
    if (!req.files) req.files = {};

    // if the request if for the root "/" without an SHA specified, and we're in
    // "dev" mode, then we can serve from the filesystem instead of git.
    if (req.is_head && !req.app.settings.bare && !req.app.settings.prod) {
      debug('reading file using "fs" module for %j', filepath);
      fs.readFile(path.join(repo_path, filepath), function (err, buf) {
        if (err && err.code != 'ENOENT') console.error(err);
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
