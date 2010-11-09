// Just a basic development setup for the blog...
var Connect = require('connect');
module.exports = Connect.createServer(
  Connect.logger(),
  require('wheat')(__dirname)
);
