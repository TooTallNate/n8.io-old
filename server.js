var express = require('express');

var app = module.exports = express();

app.use(express.logger());
app.use(function (req, res, next) {
  res.end('hello\n');
});


if (!module.parent) {
  // If this module is being invoked directly, then
  // fire up the server on the given port.
  var port = parseInt(process.env.N8_IO_PORT, 10) || 3000;
  app.listen(port, function () {
    console.log('TooTallNate.net dev server listening:', this.address());
  });
}
