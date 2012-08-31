
/**
 * Module dependencies.
 */

var http = require('http');
var app = require('./app');
var port = parseInt(process.env.N8_IO_PORT, 10) || 3000;

/**
 * Create server and listen.
 */

http.createServer(app).listen(port, function () {
  console.log('TooTallNate.net dev server listening:', this.address());
});
