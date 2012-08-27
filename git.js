
var ffi = require('ffi');
var ref = require('ref');
var Struct = require('ref-struct');

// types
var git_blob = 'void *';
var git_commit = 'void *';
var git_oid = 'void *';
var git_object = 'void *';
var git_reference = 'void *';
var git_repository = 'void *';
var git_tree = 'void *';
var git_tree_entry = 'void *';
var git_time_t = 'int64';
var git_time = Struct({
  time: git_time_t,
  offset: 'int'
});
var git_signature = Struct({
  name: 'string',
  email: 'string',
  when: git_time
});
exports.git_blob = git_blob;
exports.git_commit = git_commit;
exports.git_oid = git_oid;
exports.git_object = git_object;
exports.git_reference = git_reference;
exports.git_repository = git_repository;
exports.git_time_t = git_time_t;
exports.git_time = git_time;
exports.git_signature = git_signature;
exports.git_tree = git_tree;
exports.git_tree_entry = git_tree_entry;


var git_otype = 'int'; // enum
var GIT_OBJ_COMMIT = 1;


// libffi bindings
ffi.Library('libgit2', {

  git_blog_rawcontent: [ 'void *', [ git_blob ] ],
  git_blog_rawsize: [ 'size_t', [ git_blob ] ],

  git_commit_message_encoding: [ 'string', [ git_commit ] ],
  git_commit_message: [ 'string', [ git_commit ] ],
  git_commit_time: [ git_time_t, [ git_commit ] ],
  git_commit_time_offset: [ 'int', [ git_commit ] ],
  git_commit_committer: [ ref.refType(git_signature), [ git_commit ] ],
  git_commit_id: [ git_oid, [ git_commit ] ],
  git_commit_author: [ ref.refType(git_signature), [ git_commit ] ],
  git_commit_parentcount: [ 'uint', [ git_commit ] ],
  git_commit_parent: [ 'int', [ ref.refType(git_commit), git_commit, 'uint' ] ],
  git_commit_tree: [ 'int', [ ref.refType(git_tree), git_commit ] ],

  git_object_free: [ 'void', [ git_object ] ],
  git_object_lookup: [ 'int', [ ref.refType(git_object), git_repository, git_oid, git_otype ] ],
  git_object_lookup_prefix: [ 'int', [ ref.refType(git_object), git_repository, git_oid, 'uint', git_otype ] ],
  git_object_type: [ git_otype, [ git_object ] ],
  git_object_type2string: [ 'string', [ git_otype ] ],
  git_object_string2type: [ git_otype, [ 'string' ] ],
  git_object_typeisloose: [ 'int', [ git_otype ] ],
  git_object__size: [ 'size_t', [ git_otype ] ],

  git_oid_fmt: [ 'void', [ 'char*', git_oid ] ],
  git_oid_fromstr: [ 'int', [ git_oid, 'string' ] ],
  git_oid_fromstrn: [ 'int', [ git_oid, 'string', 'size_t' ] ],
  git_oid_tostr: [ 'string', [ 'char*', 'size_t', git_oid ] ],

  git_reference_name: [ 'string', [ git_reference ] ],
  git_reference_oid: [ git_oid, [ git_reference ] ],
  git_reference_target: [ 'string', [ git_reference ] ],
  git_reference_type: [ 'int', [ git_reference ] ],

  git_repository_open: [ 'int', [ ref.refType(git_repository), 'string' ] ],
  git_repository_head: [ 'int', [ ref.refType(git_reference), git_repository ] ],

  git_tree_id: [ git_oid, [ git_tree ] ],
  git_tree_entrycount: [ 'uint', [ git_tree ] ],
  git_tree_entry_byname: [ git_tree_entry, [ git_tree, 'string' ] ],
  git_tree_entry_byindex: [ git_tree_entry, [ git_tree, 'uint' ] ],

  git_tree_entry_attributes: [ 'uint', [ git_tree_entry ] ],
  git_tree_entry_name: [ 'string', [ git_tree_entry ] ],
  git_tree_entry_id: [ git_oid, [ git_tree_entry ] ],
  git_tree_entry_type: [ git_otype, [ git_tree_entry ] ],

}, exports);


// inline functions
exports.git_commit_lookup = function (commit, repo, id) {
  return exports.git_object_lookup(commit, repo, id, GIT_OBJ_COMMIT);
};

exports.git_commit_lookup_prefix = function (commit, repo, id, len) {
  return exports.git_object_lookup_prefix(commit, repo, id, len, GIT_OBJ_COMMIT);
};

exports.git_blob_free = exports.git_object_free;
exports.git_commit_free = exports.git_object_free;
exports.git_tree_free = exports.git_object_free;
