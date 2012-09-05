Title: Cross Compiling Node.js v0.8.x
Date: Wed, 05 Sep 2012 20:07:06 GMT

The `#node.js` IRC room has been getting a lot more requests for building Node.js
for ARM processors lately. This has sparked my personal interest as well given the
fact that I had to compile node for the Raspberry Pi in order for this blog to be
running! That said, I'd like to share my experiences in cross-compiling from
another computer.

Since building it on the Raspberry Pi itself takes over 2 hours (even though my
device is overclocked by 150mhz), you really _do_ want to learn how to
cross-compile, especially if this is something you plan on doing often, which
I do.

### Getting prepared

This tutorial doesn't directly cover the setup of your cross-compiler. It is
assumed you have that part figured out already. It will be necessary to have the
`gcc`, `g++`, and `ar` programs from your cross-compiler working properly. In my
case, these programs I will user are in my `$PATH` already with an
"arm-unknown-linux-gnueabi" prefix:

  * __arm-unknown-linux-gnueabi-gcc__
  * __arm-unknown-linux-gnueabi-g++__
  * __arm-unknown-linux-gnueabi-ar__

### Get the node source code

You can probably skip this step if you already have the node source code, but for
reference, we need to clone the main repo and checkout the `v0.8` branch:

``` bash
$ git clone git://github.com/joyent/node.git
$ cd node
$ git checkout v0.8
```

You may checkout a stable tag like `v0.8.8` if you'd like instead. It's up to you.

___Optional:___ I also have a `pi` branch that's based off of the `v0.8` branch,
which includes an upstream libuv patch to fix `os.cpus()` on ARM processors, and
an upstream V8 fix to work properly on ARM processors that only inclue support for
VFP2, but not VFP3. You can check that out here if you'd like:

  * https://github.com/TooTallNate/node/compare/joyent:v0.8...TooTallNate:pi

### Set "exports"

Cross-compiling with `gyp` is actually not so bad. It turns out we only need to
set 4 env variables and things seems to works as expected after:

``` bash
$ export AR=arm-unknown-linux-gnueabi-ar
$ export CC=arm-unknown-linux-gnueabi-gcc
$ export CXX=arm-unknown-linux-gnueabi-g++
$ export LINK=arm-unknown-linux-gnueabi-g++
```

Note that the `LINK` variable (autotools uses `LD` I think but `gyp` is weird)
points to your `g++` program.

#### Force "linux" mode on gyp (OS X only)

Skip this part if you're already on Linux, but I'm doing this on OS X, and gyp
assumes that you're building for the host platform, but in this case we're not.

I had to apply a patch like the one below in order to _force_ the "linux flavor"
in gyp. This `GetFlavor` function _seems_ like it's configurable, but I haven't
yet figured out a way to configure that a runtime.

``` diff
diff --git a/tools/gyp/pylib/gyp/common.py b/tools/gyp/pylib/gyp/common.py
index 6144d2f..fdd32a9 100644
--- a/tools/gyp/pylib/gyp/common.py
+++ b/tools/gyp/pylib/gyp/common.py
@@ -367,7 +367,7 @@ def GetFlavor(params):
     'freebsd9': 'freebsd',
   }
   flavor = flavors.get(sys.platform, 'linux')
-  return params.get('flavor', flavor)
+  return 'linux'
 
 
 def CopyTool(flavor, out_path):
```

### The "configure" step

At this point we can execute the `./configure` step. The only catch here is that
we have to disable V8 "snapshot" support, since it requires being able to _run_
the compiled copmile natively, which is not possible when cross-compiling.

``` bash
$ ./configure --without-snapshot
```

You might also need to set `--dest-cpu=arm`, but it was not necessary for
me because the `./configure` script auto-detected the arch type from the `gcc`
program specified in the `CC` variable. Your mileage may vary.

### The "make" step

And now it's time to run `make`. This is the whole reason we're cross-compiling:
to cut this step down, in my case, from 2 hours to 2 minutes. In fact, since I'm
going to be cross-compiling on a quad-core machine with hyper threading, I'll go
ahead and utilize Make's `--jobs` switch to parallelize the build. I'm going to
use a value of `8` but you should set that to roughly the number of CPU cores
you have.

``` bash
$ make --jobs=8
```

### We're done!

If things went well, you should have a shiny new `node` executable for your target
architecture. We can verify that with the `file` command:

``` bash
$ file out/Release/node
out/Release/node: ELF 32-bit LSB executable, ARM, version 1 (SYSV), dynamically linked (uses shared libs), for GNU/Linux 3.1.10, not stripped
```

`file` says "ARM" and "for GNU/Linux" so we're looking good. Go ahead and transfer
that file to your target machine and try things out! Let me know in the comments
if things work out for you or not.
