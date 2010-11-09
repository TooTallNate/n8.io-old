var HttpRequestStack = require('http-stack').HttpRequestStack;
var GzipDecoderStack = require('gzip-stack').GzipDecoderStack;

// The low-level Stream instance.
var conn = require('net').createConnection('www.example.com', 80);

// The 'req' var exposes a 'request' function, that `write()`s an
// HTTP request to the underlying writable Stream.
var req = new HttpRequestStack(conn);
req.request('POST', '/form', [
  'Host: www.example.com',
  'Accept-Encoding: gzip'
]);

// `write()` calls transparently add HTTP chunked encoding beind the scenes.
req.write("formdata=whatever");
// `end()` DOES NOT call end() on the net.Stream, but ends the HTTP request.
// The net.Stream could theoretically be reused for a 'keep-alive' connection.
req.end();

// Gets emitted after HTTP response headers have been received and parsed.
req.on('response', function(res) {
  if (res.headers['Content-Encoding'] == 'gzip') {
    // Oh noes, the response is 'gzip'ed, guess we'll have to decode it.
    res = new GzipDecoderStack(res);
  }
  // Just `pipe()` the clear-text response body to 'stdout'.
  res.pipe(process.stdout);
  
  // When the HTTP response has ended, close the underlying `net.Stream`.
  res.on('end', function() {
    conn.end();
  });
});
