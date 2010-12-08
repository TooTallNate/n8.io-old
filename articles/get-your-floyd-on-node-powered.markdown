Title: Get Your "Floyd" on, Node-powered!
Author: Nathan Rajlich
Date: Wed Dec 08 2010 09:47:53 GMT-0800 (PST)
Categories: nodejs, icecast, streamstack, pink, floyd


People who follow the [NodeJS Mailing List][MailingList] might have already
seen/heard my newest little experiment:
an [Icecast][]-compatible server, written with [NodeJS][]!

Which has lead me to begin my long-running experiment of a continuous stream
running for a _long time_. The only music I thought appropriate to mesh with
the awesomeness of [Node][NodeJS] itself would be my favorite band of all time...
[The Pink Floyd][Pink Floyd]!


## Comfortably Numb

I'll post the link to the "final result" first, so that you can be _comfortably numb_
while reading the rest of this article. It should work in any HTML5
`<audio>`-compatible web browser (try in on your smart phone!):

 * [http://tootallnate.net:5555][NodeFloyd] - Web Client for "Node Floyd"

Cool huh!? Not even a _REAL_ Icecast server could deliver the song-change
events as well as Node can! Now to learn how it all works, read on!


## Keep Talking

Coming up with a reusable server model was important to me. I wanted to be
able to change the input audio stream at will, and be able to reuse the server
code. To accomplish that, I decided to simply have the Node server read raw
PCM audio data from `stdin`. This would allow me have any arbitrary script
infinitely pipe raw PCM audio data to it's `stdout`. This made launching the
server look something like this:

    ./pipeAudioData.sh | node icecast-server.js
    
So long as `pipeAudioData.sh` never quits, and is continuously piping audio
data to `stdout`, it can be used as a source for our [Icecast][] clone!

Here's an example of having ffmpeg record from your microphone, and turning
that audio into an Icecast stream:

    ffmpeg -f alsa -ac 2 -i pulse -f s16le -acodec pcm_s16le - | node icecast-server.js


## Any Colour You Like

It was trivial to offer different encoding formats in order to support a wide
range of clients (and web browsers). I just needed to figure out the
command-line arguments to encode the raw PCM data being fed from the external
program (`pipeAudioData.sh`), into the format desired.

 * __/stream.mp3__
   - MP3 is supported through `lame`.
 * __/stream.ogg__
   - OGG Vorbis is supported through `oggenc`.
 * __/stream.aac__
   - AAC is supported through `faac`.
 * __/stream.aacp__
   - HE-AAC (aacPlus) is supported through [my fork of aacplusenc][aacplusenc],
   which adds support for indefinitely reading raw PCM from `stdin`.


## Echoes

Now at this point we can stream all these different formats to capable clients.
Though some clients, like VLC or iTunes, are even more capable, in that they
can parse and display `metadata` "events" from the audio stream in their UI.
In other words, they can display the currently playing song title. That's
_awesome_ and obviously something that we want to hook into with Node. In fact,
it was the _inital_ inspiration for this project in the first place!

Read an [unofficial specification here](http://www.smackfu.com/stuff/programming/shoutcast.html).

My [node-icecast-stack][icecast-stack] module takes care of both parsing
"metadata" events from a remote Icecast stream, and injecting "metadata" events
into raw audio streams. For the server, we'll be using the later feature.

Any client that sends a `icy-metadata` HTTP header will gets the proper
"metadata" events sent to it though the `IcecastWriteStack` class.

The `pipeAudioData` script takes care of notifying the Node server when the
song changes. The Node server then notifies all capable clients with the
`queueMetadata()` function.


## Learning to Fly

So now I've got a pretty sweet little Icecast clone working here. I still have
plans for it though! I hope you enjoy the fruits of my labor!

Some future plans:

  * Spruce up the UI on the web client page; `text-shadow`, `color`, text gradients.
  * Replace the long-polling implementation on the web client with Socket.IO.
  * Experiment with `<video>` and Theora, H.264, VP8...

Don't stop the Floyd!


[NodeJS]: http://nodejs.org/
[Icecast]: http://en.wikipedia.org/wiki/Icecast
[NodeFloyd]: http://tootallnate.net:5555/
[Pink Floyd]: http://en.wikipedia.org/wiki/Pink_Floyd
[aacplusenc]: https://github.com/TooTallNate/aacplusenc
[MailingList]: http://groups.google.com/group/nodejs/browse_thread/thread/1c0c1eb27aaf6534
[icecast-stack]: https://github.com/TooTallNate/node-icecast-stack
