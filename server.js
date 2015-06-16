
/**
 * Module dependencies.
 */

var http = require('http');
var app = require('./app');
var port = parseInt(process.env.N8_IO_PORT, 10) || 3000;

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen.
 */

server.listen(port, function () {
  port = server.address().port;

 // Set the process title.
  process.title = 'n8.io: port ' + port;

  console.log('n8.io %j server listening on port: %d', app.settings.env, port);
  console.log('libgit2 version %j', app.settings.version);
});
