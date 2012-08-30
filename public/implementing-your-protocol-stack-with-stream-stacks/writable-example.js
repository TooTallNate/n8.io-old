var StreamStack = require('stream-stack').StreamStack;

// Define a 'StreamStack' subclass: DoubleWrite
function DoubleWrite(stream) {
  StreamStack.call(this, stream);
}
require('util').inherits(DoubleWrite, StreamStack);

// Overwrite the default `write()` function.
DoubleWrite.prototype.write = function(data) {
  for (var i=0, l=data.length; i<l; i++) {
    this.stream.write(data[i] + data[i]);
  }
}

// How to Use:
var doubleStdout = new DoubleWrite(process.stdout);
doubleStdout.end("hello world!");
