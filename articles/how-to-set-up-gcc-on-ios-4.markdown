Title: How To: Set up GCC on iOS 4
Author: Nathan Rajlich
Date: Thu, 07 Jul 2011 03:20:17 GMT



Even though I have the [source for my iOS port of node][port] up on GitHub,
people are apparently still having trouble compiling it on their own since they
can't seem to even get **gcc** up and running properly. I've been meaning to put
together a walkthrough of how to set gcc up from a fresh jailbreak, but have
been waiting for the iPad 2 jailbreak so I base the walkthrough off of that. Now
that @comex finally released jailbreakme.com (thanks!), I can finally write it.
So here it goes.


## Fresh Jailbreak, Cydia Installed

So this walkthough is being written using a freshly jailbroken iPad 2. At this
point nothing is installed except Cydia. It should also be noted that I'm using
[this guide from syshalt][syshalt] as a basis for this walkthrough.

The first thing we're gonna want to do is get off the device and onto something
with a real keyboard. So with Cydia, install:

 * `OpenSSH`
 * `curl`
 * `apt7`

So those will allow us to SSH into the device. We also get **curl** and
**apt-get** which we will be using to retrieve files and install other packages.


## Log into your iDevice via SSH

You must log in as the `root` user, and the default password is `alpine`. Be
sure to change that, lest your iPhone gets hacked!

So log into your iDevice via SSH on another machine. We're going to use apt-get
to install the rest of the dependencies because using just Cydia is too slow.

Run this:

    $ apt-get install uuid csu odcctools rsync


## Install lib and header files

We're gonna take a different route than the syshalt guide. They have `.tar.gz`
files of the necessary lib and header files. These seemed outdated to me, and
were giving me problems while trying to compile. Instead, we're going to take
a much cleaner route: `rsync`!

So open a new Terminal tab, and run the following commands. Be sure to replace
the IP Address in the examples (`10.0.1.93`) with the actual ip address of your
device:

    $ rsync -avz --ignore-existing -e ssh /Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS4.3.sdk/usr/lib/ root@10.0.1.93:/usr/lib
    $ rsync -avz --ignore-existing -e ssh /Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS4.3.sdk/usr/include/ root@10.0.1.93:/usr/include
    $ rsync -avz --ignore-existing -e ssh /Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS4.3.sdk/System/Library/PrivateFrameworks/ root@10.0.1.93:/System/Library/PrivateFrameworks/
    $ rsync -avz --ignore-existing -e ssh /Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS4.3.sdk/System/Library/Frameworks/ root@10.0.1.93:/System/Library/Frameworks/
    $ scp /Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator4.3.sdk/usr/include/crt_externs.h root@10.0.1.93:/usr/include/crt_externs.h

These `rsync` commands copy over the missing files from your iDevice's:

 * `/usr/lib`
 * `/usr/include`
 * `/System/Library/Frameworks`
 * `/System/Library/PrivateFrameworks`

directories from the official Apple SDK. This is a lot safer than blindly
copying over some outdated tar file, and also copies over the header files
needed to do iPhone App compilation (Foundation, UIKit, et al.)

That last `scp` command copies over the `crt_externs.h` header file, which is
needed to compile NodeJS, but strangely isn't anywhere in the Apple SDK for iOS,
but _is_ available in the Simulator. So we just copy it over from there.


## Install gcc

So ever since iOS 3.0 came out, gcc has been a pain in the ass to get running
on a jailbroken device. Additionally, the necessary `libgcc` package is nowhere
to be found on Cydia's repositories (for legal reasons?). On with the
walkthough:

On _the SSH session to your device_, run:

    $ curl -O https://tootallnate.net/how-to-set-up-gcc-on-ios-4/fake-libgcc_1.0_iphoneos-arm.deb
    $ dpkg -i fake-libgcc_1.0_iphoneos-arm.deb

That gets the _"fake"_ libgcc package installed. Now run:

    $ curl -O https://tootallnate.net/how-to-set-up-gcc-on-ios-4/iphone-gcc_4.2-20080604-1-8_iphoneos-arm.deb
    $ dpkg -i iphone-gcc_4.2-20080604-1-8_iphoneos-arm.deb

And that's pretty much it! You now have `gcc` installed with the needed header
and library files from the Apple SDK as well. Congrats!


## What to compile?

Well a lot of build scripts of popular open source projects need more than just
`gcc` to compile, so let's install some more (optional) packages from Cydia's
repos:

    $ apt-get install gawk make python coreutils inetutils git less

These packages will make your iDevice more "Unixey" by installing a lot of
_standard_ Unix applications, that a lot of build scripts will depend on.


### VIM

The version in Cydia's repo is **7.1** but I rely on some features only made
available in **7.3**, so I wanted to compile that first:

    $ curl -O ftp://ftp.vim.org/pub/vim/unix/vim-7.3.tar.bz2
    $ tar xjvf vim-7.3.tar.bz2 && cd vim73
    $ ./configure --enable-multibyte --with-features=huge --disable-darwin
    $ make

Ironic, but `--diable-darwin` was required to disable trying to use the
__Carbon__ Framework, which isn't on iOS.


### [NodeJS][]

Duh! My fork makes this super simple now that we've done the dirty work above:

    $ git clone git://github.com/TooTallNate/node.git
    $ cd node
    $ ./configure
    $ make

And that's it!

Get to compiling y'all!!!


[node-iOS]: https://github.com/TooTallNate/node-iOS
[NodeJS]: http://nodejs.org
[port]: https://github.com/TooTallNate/node/tree/iphone-build
[syshalt]: http://blog.syshalt.net/index.php/2010/09/12/compile-c-applications-with-gcc-on-ios-4-iphone
