
/**
 * Module dependencies.
 */

var git = require('./git');
var inherits = require('util').inherits;
var debug = require('debug')('n8.io:git-error');

/**
 * Module exports.
 */

module.exports = GitError;

/**
 * `GitError` constructor.
 */

function GitError (name, code) {
  Error.call(this);
  Error.captureStackTrace(this, GitError);

  if (name) this.name = name;
  if (null != code) this.code = code;

  var lastErr = git.giterr_last();
  if (!lastErr.isNull()) {
    this.git_error = lastErr.deref();
    this.message = this.git_error.message;
    this.klass = this.git_error.klass;
  } else {
    debug('giterr_last() returned NULL');
  }
}
inherits(GitError, Error);

GitError.prototype.name = 'GitError';
