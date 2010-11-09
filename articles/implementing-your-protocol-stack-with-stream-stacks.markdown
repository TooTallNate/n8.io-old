Title: Implementing your Protocol Stack with "StreamStacks" and NodeJS
Author: Nathan Rajlich
Date: Mon, 08 Nov 2010 23:48:11 GMT
Categories: nodejs, streamstack, streams


I've been experimenting with an abstraction on top of [NodeJS][]'s `Stream`
class that I'd like to share with you.  I call them [StreamStacks][stream-stack].
The concept is pretty simple: a _StreamStack_ instance acts as a "middle-man"
for a low-level Node _Stream_ instance. Or more precisely, all __events__ that
get __emitted__ from the _Stream_ instance get proxied __*down*__ the "stream
chain", and all function calls on a _StreamStack_ instance get proxied
__*up*__ the "stream chain".

This gets really powerful by subclassing the `StreamStack` class. This gives
the subclass ultimate control of the `write()` calls (on a _writable_ stream)
and/or `data` events that are emitted on the (_readable_) stream. The subclass
can then do _something_ with the data before it is transparently passed back
to the underlying _Stream_ instance.

If what I'm saying doesn't make any sense to you, then hopefully some examples
in code will:


## A "Writable Stream" Example

Let's look at a simple example. We'll define a subclass of `StreamStack`,
called `DoubleWrite`. This class' job is to intercept any `write()` calls on
the writable stream passed to it's constructor, and instead write each byte or
char _twice_ on the resulting stream:

<implementing-your-protocol-stack-with-stream-stacks/writable-example.js*>

I like to use `process.stdout` as a _development_ writable stream,
since what gets written is visibly printed to the terminal, and I can manually
verify the output.

As you can see, we create a `DoubleWrite` instance, passing `process.stdout`
to the constructor. Now, every time the _doubleStdout_ variable gets written
to, the contents of the `write()` will be written to stdout _twice_!

This isn't a very practical example, but consider something like a
[GzipEncoderStack][gzip-stack] class, which first encodes the written contents with gzip
compression, before finally being sent off to the underlying write stream.


## A "Readable Stream" Example

The same principle can be used with readable streams as well. In this example,
we'll define the `DoubleRead` class, which, when 'data' is received from the
parent stream, emits the data _twice_ on the DoubleRead instance.

<implementing-your-protocol-stack-with-stream-stacks/readable-example.js*>

What's written to `process.stdout` here is the output of the `DoubleRead`
instance. It acts as a replica of the original dummy stream, except that it
emits all of it's 'data' events twice for each char/byte.

Again, not a very practical example, but similarly, what's being shown here
is that things like a [GzipDecoderStack][gzip-stack] are possible, and easy
in fact!


## So What's Possible?

Ok, so hopefully you're starting to embrace the power that these "stacks" can
behold. The `StreamStack` "ideology" is that the user is responsible for
creating the low-level Stream instance, and then _stacking_ StreamStack
instances on top of one another until your protocol stack is fulfilled, and
you can blissfully `pipe()` into or from a "stacked" stream.

Consider this (currently theoretical) example of an
[HTTP client request][http-stack] based on `StreamStack`s:

<implementing-your-protocol-stack-with-stream-stacks/http-request.js>

For debugging purposes, create a `HttpRequestStack` instance with
`process.stdout`, and the request will be printed to stdout for inspection.

I hope you like the idea! All related code is obviously hosted on GitHub, so
please, peek, poke, fork, patch, contribute, etc. Cheers!

* [node-stream-stack][stream-stack]
* [node-http-stack][http-stack]
* [node-gzip-stack][gzip-stack]


[NodeJS]: http://nodejs.org/
[stream-stack]: https://github.com/TooTallNate/node-stream-stack
[gzip-stack]: https://github.com/TooTallNate/node-gzip-stack
[http-stack]: https://github.com/TooTallNate/node-http-stack
