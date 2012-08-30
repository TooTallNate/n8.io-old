var Stream = require('stream').Stream;
var StreamStack = require('stream-stack').StreamStack;

// Define a 'StreamStack' subclass: DoubleRead
function DoubleRead(stream) {
  var self = this;
  StreamStack.call(self, stream);
  stream.on('data', function(data) {
    for (var i=0, l=data.length; i<l; i++) {
      self.emit('data', data[i] + data[i]);
    }
  });
}
require('util').inherits(DoubleRead, StreamStack);

// How to Use:
var dummyStream = new Stream();
(new DoubleRead(dummyStream)).pipe(process.stdout);
dummyStream.emit('data', "hello world!");
