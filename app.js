// Just a basic development setup for the blog...
var Connect = require('connect');
var server = module.exports = Connect.createServer(
  Connect.logger(),
  require('wheat')(__dirname)
)
if (!module.parent) {
  server.listen(3000, function () {
    console.log('TooTallNate.net dev server listening:', this.address());
  });
}
