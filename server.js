
/**
 * Module dependencies.
 */

var http = require('http');
var app = require('./app');
var port = parseInt(process.env.N8_IO_PORT, 10) || 3000;

/**
 * Create dev server.
 */

var server = http.createServer(app);

/**
 * Listen.
 */

server.listen(port, function () {
  console.log('n8.io dev server listening:', this.address());
});
