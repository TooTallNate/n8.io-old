// Just a basic server setup for this site
var Connect = require('connect');

module.exports = Connect.createServer(
  Connect.logger(),
  // Caching isn't necessary in development mode...
  //Connect.conditionalGet(),
  //Connect.cache(),
  //Connect.gzip(),
  require("wheat")(__dirname)
);
