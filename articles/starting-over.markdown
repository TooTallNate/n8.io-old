Title: Starting Over
Date: Sun, 02 Sep 2012 00:45:15 GMT

Every now and then you just want to start over. That goes for anything, by in this
case it was my blog. There were a few contributing factors that led me to want to
do this, but mainly I was sick of the old engine and had a shiny new
[Raspberry Pi][pi] that I wanted a good use-case for.

## The Raspberry Pi

I was on the waiting list to get a [Raspberry Pi][pi] from February to like July,
and finally I was able to purchase one of the units. And while I knew I wanted
one, I didn't have a reason to use it yet.

I had an old Pentium 4 "server" that acted as a file share and torrent slave for
the rest of the computers in the house. It also ran the old "tootallnate.net"
website. The problem is that it's old, big and klunky, draws lots of power and is
unreliable (would randomly shut off and I would have to restart it manually). I
was dying to get rid of the thing.

All of the sudden this little Pi is looking like it'll be the replacement.

## Switch from _tootallnate.net_ to _n8.io_

One of the main things I also wanted to do was have my blog's main URL be my
`n8.io` domain, rather than `tootallnate.net`.

## Ditching the old blog engine

Tim Caswell's "[Wheat][wheat]" blog engine was great, and I would be lying if I
said this new engine wasn't hugely inspired and structured around Wheat, but I
wanted something that used [libgit2][], rather then invoking `git` child
processes.

#### Use `node-gitteh`?

The obvious choice for this would be to use [node-gitteh][], which I have used in
the past and was quite fond of. Unfortunately, at the time of this writing, the
repo does not work with node v0.8.x and it more or less unmaintained (hopefully
just for the time being).

#### Bind to `libgit2` using `node-ffi`

But I was tired of waiting, and I didn't want my Pi unpowered and collecting dust,
so I cheated a little and used [node-ffi][] to quickly bind to `libgit2` in
roughly 150 lines of code. This was a lot quicker and allowed me to get started
on this rewrite.

#### Use the existing git repo

The idea would be to use the existing blog repo from the old "tootallnate.net", so
that the existing articles would still be used (all 8 of them, HA, I need to blog
more consistently). Also the main idea of Wheat, writing your articles in
Markdown, is great and I really like markdown for doing these kinds of
presentational things (GitHub Wikis and the likes).

#### Use the existing Disqus comments

Even the old comments I wanted to keep if possible, despite the transition from
_tootallnate.net_ to _n8.io_. Disqus has a "migration" process for when you change
domains, but I haven't done that yet. I just use the old embed code from the old
domain and it still seemd to work. Good stuff Disqus!

#### Uses some great stable modules

This new blog rewrite uses some great, solid & stable Node.js modules:

  * [express v3.0][express]
  * [ffi v1.0][node-ffi]
  * [highlight.js][]
  * [jade][]
  * [lru-cache][]
  * [marked][]
  * [ref][]

## Lots of caching

On something with limited processing power like the Raspberry Pi, being smart
about caching is _very_ important. My initial attempt at this rewrite didn't do
any sort of caching, and I figured it would be fine because on the MacBook Pro
Retina everything was running in under a few milleseconds, despite being
unoptimized. However, when I first deployed on the Pi, a single HTTP request was
taking about 2 seconds. Totally unacceptable when a single page requires 5 HTTP
requests!

Caching is key here, especially because the caching characteristics of a `git`
repo are highly predictable. However, on a device with limited memory like the Pi,
you have to be careful about not caching too much to make your process blow up in
memory. Isaac Schlueter's `lru-cache` module is perfect for this job, as it drops
off lesser used items from the cache when the cache gets too big.

## Open Source!

I see no point in keeping it hidden away, so I've put the source code up on GitHub
for anyone to peek and poke at. Hey, send me a pull request and you may get
a guest post if you'd like! Enjoy!

 * https://github.com/TooTallNate/n8.io


[pi]: http://www.raspberrypi.org
[libgit2]: http://libgit2.github.com
[express]: https://npmjs.org/package/express
[highlight.js]: https://npmjs.org/package/highlight.js
[jade]: https://npmjs.org/package/jade
[lru-cache]: https://npmjs.org/package/lru-cache
[marked]: https://npmjs.org/package/marked
[node-ffi]: https://npmjs.org/package/ffi
[node-gitteh]: https://npmjs.org/package/gitteh
[ref]: https://npmjs.org/package/ref
[wheat]: ill-take-the-nodejs-on-wheat-please
