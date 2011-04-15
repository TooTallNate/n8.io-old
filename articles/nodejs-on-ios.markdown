Title: NodeJS on iOS
Author: Nathan Rajlich
Date: Fri, 15 Apr 2011 15:35:45 GMT
Node: v0.4.5



Ok, I'm gonna try to keep this one short because I only have about 15 minutes to write
this. The long story short is that I got [NodeJS][] compiled on my jailbroken iPhone 4!
It was a long quest to get it working properly but I've done the hard work and
compiled a `.deb` file compatible with Cydia for your installing pleasure...


## First, Installation

So obviously you want to get it up and running first. I haven't done much testing
as far as different devices, but I did install and uninstall this .deb from my
girlfriend's iPhone as well and it worked well. I'll try and keep [compiled NodeJS
iOS .deb files on my node GitHub fork "downloads" page][downloads]:

[https://github.com/TooTallNate/node/downloads][downloads]

The first thing I would do is SSH into your iPhone. Make sure you have the `dpkg`
command installed, otherwise go back into Cydia and get it (I think it might be under
`APT7` though, or something like that).

So get the 'node-v0.4.5-ios-arm-1.deb' file from the link above (or a newer version if
one exists), and get it onto your iDevice somehow (scp, wget, curl, etc.). Once it's
downloaded onto your device, you should be able to run:

    $ dpkg -i node-v0.4.5-ios-arm-1.deb

And that's it! After that try to mess around with node:

    $ node
    > require('os').cpus()
    [ { model: 'N90AP',
        speed: 0,
        times: 
         { user: 9209240,
           nice: 0,
           sys: 6997410,
           idle: 255377220,
           irq: 0 } } ]

The [N90AP][] is the CPU my iPhone 4 is running, so hot damn, we're running node on
an iPhone!


## Now What?

The first thing I did was install npm. This was also my first try at the new npm `1.0`
stuff. I really like it, but that's another story :P

No seriously, what the hell use is node on an iPhone (or other iDevice?). While I
haven't found any awesome reasons yet, I do know that they will probably involve utilyzing
the hardware of the device, i.e. the accelerometer, the digital compass, the touch events,
etc.

So that's why I've starting [node-iOS][], working on getting bindings for the iOS
APIs that are fun to use. The library is very minimal at the moment. I'm ashamed to say
that only a `vibrate()` function is currently implemented (which is still somewhat fun
to play with in it's own right), but more is definitely on it's way!

If you come up with any awesome uses for node on an iDevice, definitely let me know in the comments!


[N90AP]: http://theiphonewiki.com/wiki/index.php?title=N90ap
[node-iOS]: https://github.com/TooTallNate/node-iOS
[NodeJS]: http://nodejs.org
[downloads]: https://github.com/TooTallNate/node/downloads
