Title: Converting a C library to gyp
Date: Sat, 29 Sep 2012 06:53:28 GMT

`gyp` is basically like the module system of C, similar to how node.js has its own
module system. In gyp, you construct chains of dependencies which each get
_statically_ linked together to build one big compiled unit. The same mindset is
applied when writing small, independent node.js modules.

One thing that I want to see more of in the node community from native module
authors is the additional work done to convert the dependencies of the native
module to use `gyp` to build, and bundle them with the native module. This
allows the library to be statically linked to your native module, rather than
dynamically linked. There are pros and cons to both kinds of linking,
but node.js has gone with static linking, mostly because of portability
and to ease Windows support.

Now converting the build system of some odd C library that you haven't written
can be a daunting task, so that's what this article hopes to address. I'll
explain my method of converting a C library originally using `autotools` to build
using `gyp`, and hopefully you will do the same (or improve on my method!) in
order to make your native module more portable. Your users will thank you for the
easier installation process (i.e. not having to `apt-get install` some external
libraries).

### libmp3lame, I choose you!

Our test subject for this aricle will be [`libmp3lame`][lame], a library that does
MP3 encoding and decoding. This is a nice, medium complexity library that will be
a good demonstration of my method.

### Baseline gyp file

We're gonna start with a baseline `gyp` file to use. Let's call it
`libmp3lame.gyp` in this case:

``` python
{
  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # static release
          },
        },
      }
    },
    'msvs_settings': {
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },
  },

  'targets': [
  ]
}
```

The `msvs_settings` configuration stuff at the top ensures that we end up with
statically built libraries and executables. These values match up with how node.js
addons are build, which is important. The empty `targets` array will end up with
the definitions to build the lame library, as well as a simple test program.

### Adding the platform-specific files

Most C libraries have a `./configure` step, and usually that step will create some
kind of "config.h" file of some sort, which has appropriate defines for your
current platform. So our strategy for converting to `gyp` is to pre-generate these
"config.h" files on all your supported platforms and architectures, and save them
for use when building with `gyp`.

So for example, the first platform + architecture combo I will get working is Mac
OS X 64-bit. Therefore, the resulting "config.h" file will be placed at
`config/mac/x64/config.h`. In the end, we want to support if possible this
baseline of platforms and architectures:

<table>
  <tbody>
    <tr>
      <th>OS</th><th>Arch</th><th>config.h path</th>
    </tr>
    <tr>
      <td>Linux</td><td>ARM</td><td><code>config/linux/arm</td>
    </tr>
    <tr>
      <td>Linux</td><td>32-bit</td><td><code>config/linux/ia32</td>
    </tr>
    <tr>
      <td>Linux</td><td>64-bit</td><td><code>config/linux/x64</td>
    </tr>
    <tr>
      <td>Mac OS X</td><td>32-bit</td><td><code>config/mac/ia32</td>
    </tr>
    <tr>
      <td>Mac OS X</td><td>64-bit</td><td><code>config/mac/x64</td>
    </tr>
    <tr>
      <td>Solaris</td><td>32-bit</td><td><code>config/solaris/ia32</td>
    </tr>
    <tr>
      <td>Solaris</td><td>64-bit</td><td><code>config/solaris/x64</td>
    </tr>
    <tr>
      <td>Windows</td><td>32-bit</td><td><code>config/win/ia32</td>
    </tr>
    <tr>
      <td>Windows</td><td>64-bit</td><td><code>config/win/x64</td>
    </tr>
  </tbody>
</table>

Some of the combinations might not be supported by the library you are working
with, but (except for linux-arm) this list matches up with the releases of the
official node.js binary tarballs, and what node supports, you should try to
support too!

#### Running `./configure`

With C libraries configured using `autotools`, I've been using a standard set of
switches, and adding library-specific ones as necessary to try to get as close of
a static build as `gyp` is going to make. The basic set of flags I use are:

``` bash
$ ./configure --enable-static --disable-shared --with-pic
```

These flags are basically saying, build the static version of the library (the
`.a`/`.lib` files), and don't bother with the shared version (the
`.so`/`.dylib`/`.dll` files). Also, build "[position independant code][PIC]".

In some cases, that will be all that you need. But for `libmp3lame`, I'm also
gonna need to specify a few additional flags to disable some unnecessary stuff
like the `lame` program frontend.

``` bash
$ ./configure --enable-static --disable-shared --with-pic \
              --disable-rpath --disable-frontend --disable-gtktest
```

After running [configure][] on my 64-bit Mac OS X machine, I'm going to copy the
resulting `config.h` file to `config/mac/x64/config.h`. The *"config.h"* file could
be called something else for your library, like *"expat_config.h"* for `libexpat`
for example. In some cases there could be more than 1 ".h" file generated, like
`libffi` had 3 per platform+arch combo. So you kinda just need to take a look
around, visually [inspect the `configure` output][configure], and see what
gets generated.

The first change we're going to make to the gyp file is to make sure that these
platform-specific header files are included:

``` diff
diff --git a/libmp3lame.gyp b/libmp3lame.gyp
index d30085c..cdc5b9b 100644
--- a/libmp3lame.gyp
+++ b/libmp3lame.gyp
@@ -1,4 +1,6 @@
 {
+  'variables': { 'target_arch%': 'ia32' },
+
   'target_defaults': {
     'default_configuration': 'Debug',
     'configurations': {
@@ -24,6 +26,10 @@
         'GenerateDebugInformation': 'true',
       },
     },
+    'include_dirs': [
+      # platform and arch-specific headers
+      'config/<(OS)/<(target_arch)'
+    ],
   },
 
   'targets': [
```

So you essentially need to repeat these "configure & copy to `config`" steps for
all of the platforms + arch combinations listed in the table above. I usually do
things a little out of order though, and move on to making the library build (the
next section) before worrying about the other platforms...

### Defining the `targets`

So usually the next step when building these libraries is to run the `make`
command. Sometimes you will need something additonal like overwriting a specific
variable or something, but in this case we're just invoke it stright up.

``` bash
$ make
```

The key to defining proper targets is, again, visually inspecting the
[make output][make] and seeing exactly which files are compiled, and defines are
added, and which flags are used. You can also get part of the picture by looking
at the `Makefile.am` files in the library.

So based off the make output in the case of `libmp3lame`, there's going to be
3 total "targets" that will be defined:

 * `mpglib` - libmp3lame's decoder (an old version of libmpg123 apparently)
 * `liblamevectorroutines` - some internal routines used by libmp3lame
 * `libmp3lame` the API frontend for libmp3lame

Each of these "targets" are like "modules" in node.js, they're their own
independent functional component that make up part of the library.

Ok, so let's define those targets. This is a lot of new `gyp` code here, so be
sure to study it until it makes sense to you:

``` diff
diff --git a/libmp3lame.gyp b/libmp3lame.gyp
index cdc5b9b..f30319b 100644
--- a/libmp3lame.gyp
+++ b/libmp3lame.gyp
@@ -27,11 +27,88 @@
       },
     },
     'include_dirs': [
+      'include',
+      'mpglib',
+      'libmp3lame',
+      'libmp3lame/vector',
       # platform and arch-specific headers
       'config/<(OS)/<(target_arch)'
     ],
+    'defines': [
+      'PIC',
+      'HAVE_CONFIG_H'
+    ],
   },
 
   'targets': [
+    # mpglib
+    {
+      'target_name': 'mpgdecoder',
+      'product_prefix': 'lib',
+      'type': 'static_library',
+      'sources': [
+        'mpglib/common.c',
+        'mpglib/dct64_i386.c',
+        'mpglib/decode_i386.c',
+        'mpglib/interface.c',
+        'mpglib/layer1.c',
+        'mpglib/layer2.c',
+        'mpglib/layer3.c',
+        'mpglib/tabinit.c',
+      ],
+    },
+
+    # liblamevectorroutines
+    {
+      'target_name': 'lamevectorroutines',
+      'product_prefix': 'lib',
+      'type': 'static_library',
+      'sources': [
+        'libmp3lame/vector/xmm_quantize_sub.c'
+      ],
+    },
+
+    # libmp3lame
+    {
+      'target_name': 'mp3lame',
+      'product_prefix': 'lib',
+      'type': 'static_library',
+      'sources': [
+        'libmp3lame/VbrTag.c',
+        'libmp3lame/bitstream.c',
+        'libmp3lame/encoder.c',
+        'libmp3lame/fft.c',
+        'libmp3lame/gain_analysis.c',
+        'libmp3lame/id3tag.c',
+        'libmp3lame/lame.c',
+        'libmp3lame/newmdct.c',
+        'libmp3lame/presets.c',
+        'libmp3lame/psymodel.c',
+        'libmp3lame/quantize.c',
+        'libmp3lame/quantize_pvt.c',
+        'libmp3lame/reservoir.c',
+        'libmp3lame/set_get.c',
+        'libmp3lame/tables.c',
+        'libmp3lame/takehiro.c',
+        'libmp3lame/util.c',
+        'libmp3lame/vbrquantize.c',
+        'libmp3lame/version.c',
+        'libmp3lame/mpglib_interface.c',
+      ],
+      'dependencies': [
+        'lamevectorroutines',
+        'mpgdecoder',
+      ],
+      'direct_dependent_settings': {
+        'include_dirs': [
+          'include',
+          'mpglib',
+          'libmp3lame',
+          'libmp3lame/vector',
+          # platform and arch-specific headers
+          'config/<(OS)/<(target_arch)'
+        ],
+      },
+    },
   ]
 }
```

One important thing to note is how we make the "mp3lame" target depend on
"lamevectorroutines" and "mpgdecoder". This allows us to only have to specify
"mp3lame" as a dependency in the node module's `binding.gyp` file. Also note how
the `direct_dependent_settings` are defined within that target as well, for the
same reason.

### Try it out

At this point, we should be able to build `libmp3lame`, at least on 64-bit OS X.
I like to add a very quick little test program of some sort to the gyp file, to
make sure that things get built and statically linked like we expect, and that it
works at all.

We have to add an `executable` target to the gyp file:

``` diff
diff --git a/libmp3lame.gyp b/libmp3lame.gyp
index f30319b..de2984d 100644
--- a/libmp3lame.gyp
+++ b/libmp3lame.gyp
@@ -110,5 +110,13 @@
         ],
       },
     },
+
+    # test program that prints the version number
+    {
+      'target_name': 'test',
+      'type': 'executable',
+      'dependencies': [ 'mp3lame' ],
+      'sources': [ 'test.c' ]
+    },
   ]
 }
diff --git a/test.c b/test.c
new file mode 100644
index 0000000..1fb3dbf
--- /dev/null
+++ b/test.c
@@ -0,0 +1,7 @@
+#include <stdio.h>
+#include "lame.h"
+
+int main () {
+  printf("get_lame_version(): %s\n", get_lame_version());
+  return 0;
+}
```

This super basic test program simply prints out the result of the
`get_lame_version()` function. Let's download `gyp`, configure our project, and
run this `test` program:

``` bash
$ svn co http://gyp.googlecode.com/svn/trunk gyp  # download gyp
$ ./gyp/gyp -f make --depth=. libmp3lame.gyp  # run gyp for the `make` target
$ make V=1  # verbose build
$ ./out/Debug/test  # run the `test` program
get_lame_version(): 3.99.5
```

Success!

### Windows support

So after generating all the config files for the other platforms (mac, linux,
solaris), the last one is Windows (win). Windows usually takes some special
dedication to get working. At the very least, a [Google search][google] asking
"how to build library xxxx on Windows" should yield [something][].

If there are any major differences, you can introduce a `conditions` block in your
gyp file targeting Windows like so:

``` python
    'conditions': [
      ['OS=="win"', {
        # windows-specific gyp stuff goes here...
      }],
    ],
```

#### The config files

In the case of `libmp3lame`, the developers have included a hand-crafted
`configMS.h` file, which is the config.h file for Windows, both 32-bit and 64-bit.
So all we have to do this time is copy this file to `config/win/ia32` and
`config/win/x64`. Piece of cake!

In some cases though you might have to actually run the `./configure` script using
version of `bash` compiled for Windows. This was the case for `libffi`.

#### The source files and defines

It's ideal to actually run the build process for your library, ideally using MSVC,
doing the method that the library authors suggest. That way you can inspect that
build output and be able to determine any differences for the build on Windows.

For `libmp3lame`, there's a `Makefile.MSVC` file that is compatible with the
`nmake` command on Windows. If we run it and [inspect the output][make-windows], we
can see that there are a few different defines used on Windows, but all the same
sources files.

Let's adjust the gyp file to reflect that:


``` diff
diff --git a/libmp3lame.gyp b/libmp3lame.gyp
index de2984d..bb4b010 100644
--- a/libmp3lame.gyp
+++ b/libmp3lame.gyp
@@ -38,6 +38,16 @@
       'PIC',
       'HAVE_CONFIG_H'
     ],
+    'conditions': [
+      ['OS=="win"', {
+        'defines': [
+          'TAKEHIRO_IEEE754_HACK',
+          'FLOAT8=float',
+          'REAL_IS_FLOAT=1',
+          'BS_FORMAT=BINARY',
+        ]
+      }]
+    ],
   },
 
   'targets': [
```

Sometimes additional sources files are used (or not used) so in that case you
would add a `sources` block withing that conditional.

At this point, Windows should work as well:

``` bash
C:\Users\Nathan\Desktop\lame> svn co http://gyp.googlecode.com/svn/trunk gyp
C:\Users\Nathan\Desktop\lame> gyp\gyp.bat -f msvs -G msvs_version=2010 --depth=. libmp3lame.gyp
C:\Users\Nathan\Desktop\lame> msbuild libmp3lame.sln
C:\Users\Nathan\Desktop\lame> Debug\test.exe
get_lame_version(): 3.99.5
```

Excellent!


### The finished `gyp` file

So we're done! At this point, we have our completed gyp file:

``` python
{
  'variables': { 'target_arch%': 'ia32' },

  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # static release
          },
        },
      }
    },
    'msvs_settings': {
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },
    'include_dirs': [
      'include',
      'mpglib',
      'libmp3lame',
      'libmp3lame/vector',
      # platform and arch-specific headers
      'config/<(OS)/<(target_arch)'
    ],
    'defines': [
      'PIC',
      'HAVE_CONFIG_H'
    ],
    'conditions': [
      ['OS=="win"', {
        'defines': [
          'TAKEHIRO_IEEE754_HACK',
          'FLOAT8=float',
          'REAL_IS_FLOAT=1',
          'BS_FORMAT=BINARY',
        ]
      }]
    ],
  },

  'targets': [
    # mpglib
    {
      'target_name': 'mpgdecoder',
      'product_prefix': 'lib',
      'type': 'static_library',
      'sources': [
        'mpglib/common.c',
        'mpglib/dct64_i386.c',
        'mpglib/decode_i386.c',
        'mpglib/interface.c',
        'mpglib/layer1.c',
        'mpglib/layer2.c',
        'mpglib/layer3.c',
        'mpglib/tabinit.c',
      ],
    },

    # liblamevectorroutines
    {
      'target_name': 'lamevectorroutines',
      'product_prefix': 'lib',
      'type': 'static_library',
      'sources': [
        'libmp3lame/vector/xmm_quantize_sub.c'
      ],
    },

    # libmp3lame
    {
      'target_name': 'mp3lame',
      'product_prefix': 'lib',
      'type': 'static_library',
      'sources': [
        'libmp3lame/VbrTag.c',
        'libmp3lame/bitstream.c',
        'libmp3lame/encoder.c',
        'libmp3lame/fft.c',
        'libmp3lame/gain_analysis.c',
        'libmp3lame/id3tag.c',
        'libmp3lame/lame.c',
        'libmp3lame/newmdct.c',
        'libmp3lame/presets.c',
        'libmp3lame/psymodel.c',
        'libmp3lame/quantize.c',
        'libmp3lame/quantize_pvt.c',
        'libmp3lame/reservoir.c',
        'libmp3lame/set_get.c',
        'libmp3lame/tables.c',
        'libmp3lame/takehiro.c',
        'libmp3lame/util.c',
        'libmp3lame/vbrquantize.c',
        'libmp3lame/version.c',
        'libmp3lame/mpglib_interface.c',
      ],
      'dependencies': [
        'lamevectorroutines',
        'mpgdecoder',
      ],
      'direct_dependent_settings': {
        'include_dirs': [
          'include',
          'mpglib',
          'libmp3lame',
          'libmp3lame/vector',
          # platform and arch-specific headers
          'config/<(OS)/<(target_arch)'
        ],
      },
    },

    # test program that prints the version number
    {
      'target_name': 'test',
      'type': 'executable',
      'dependencies': [ 'mp3lame' ],
      'sources': [ 'test.c' ]
    },
  ]
}
```

### Are we done yet?

No still not done... now we have to add it as a dependency to our node.js
native addon.

Following the model of node.js core, I'm gonna place libmp3lame with our gyp stuff
in `deps/lame` of the `node-lame` repo. After that I can add it as a dependency
to the main `binding.gyp` file like so:

``` python
{
  'targets': [
    {
      'target_name': 'bindings',
      'sources': [
        'src/bindings.cc',
        'src/node_lame.cc'
      ],
      'dependencies': [
        'deps/lame/libmp3lame.gyp:mp3lame'
      ]
    }
  ]
}
```

The `binding.gyp` file remains nice and simple. __NOW__ we're done. Grab a pint!



[lame]: http://lame.sourceforge.net
[configure]: ./configure-output.txt
[make]: ./make-output.txt
[make-windows]: ./make-windows-output.txt
[google]: http://lmgtfy.com/?q=how+do+i+compile+lame+on+windows%3F
[something]: http://wehuberconsultingllc.com/wordpress/2007/12/30/building-the-lame-mp3-encoder-using-visual-studio-8-express
[PIC]: http://wikipedia.org/wiki/Position-independent_code
