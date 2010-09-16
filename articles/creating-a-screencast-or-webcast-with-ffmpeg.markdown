Title: Creating a Screencast or Webcast with "ffmpeg"
Author: Nathan Rajlich
Date: Mon Sep 16 2010 10:39:00 GMT-0700 (PDT)


These two `ffmpeg` commands can be used to create high-quality screencasts or webcasts, respectively.
I'm just recording them here in case they roll off my `bash` history on my laptop.
I've only gotten successful results with Linux (only tried Ubuntu 9.10); OS X has problems
that I'll explain seperately below.


## Recording from a Screen

    $ ffmpeg \
        -f x11grab -r 30 -s 1366x768 -i :0.0 \
        -f alsa -ac 2 -i pulse \
        -vcodec libx264 -vpre lossless_ultrafast \
        -acodec pcm_s16le \
          screencast.mkv

I'll explain each line seperately:

 * _ffmpeg_ invokes the `ffmpeg` command. I hope you knew that part...
 * The 2nd line specifies the video input stream. In this case it is the current X11 display.
   Your `ffmpeg` compilation must have been configured with the `--enable-x11grab` option for
   this to work. Be sure to change the `1366x768` part to the resolution of your screen. If
   you're having problems, make sure that this command produces the some kind of output:
   `ffmpeg -formats 2>/dev/null | grep x11grab`
 * The 3rd line specifies the audio input stream. This part can vary depending on hardware,
   but the setup shown assumes that audio is controlled by the ALSA driver.
 * The 4th line specifies that the output video codec will use `libx264`, and specifically the
   `lossless_ultrafast` preset. This saves the video without any loss in quality.
 * The 5th line specifies that the output audio codec will be `pcm_s16le`, or PCM Signed 16-bit
   Little Endian. This is raw and uncompressed; very high-quality.
 * And finally we name the output file. The file extension (`.mkv`) is important to `ffmpeg`. It's
   how it determines the output container format. In this case we'll use the Matroska container.

This command works on my Ubuntu laptop, but fails on OS X with the same laptop. OS X has an
X11 server built in, but it is rarely used in today's OS X applications, and cannot be used
with `ffmpeg` to get a capture of the entire screen. I've managed to get `ffmpeg` compiled with
_x11grab_ on OS X, but the resulting capture has only a black screen, and I can sometimes see
the mouse move around. I suppose if I had any X11 apps open (i.e. Gimp) it might be able to
record them, but in any case, it seems screencasts with `ffmpeg` on OS X is useless.


## Recording from a Camera

    $ ffmpeg \
        -f video4linux2 -s 320x240 -r 30 -i /dev/video0 \
        -f alsa -ac 2 -i pulse \
        -vcodec libx264 -vpre lossless_ultrafast \
        -acodec pcm_s16le \
          webcast.mkv

Now, the observant people will realize that all that's been changed in this example is the 2nd
line, specifying the video input stream. All other settings remain the same, so I won't go
over them again.

In this case, however, we're using the `video4linux2` format, with the `/dev/video0` device. This
represents the webcam built into my laptop. We also specify the resolution and frames per second
of the video stream.


## So what now?

The above two commands attempt to generate a "lossless" representation of the input streams. This
is useful for the master copy, but more than likely you want to distribute the video over the internet
to someone. Also Matroska isn't an entirely widely adopted format. So you should definitely convert
the output file to whatever is appropriate for your target.

Maybe I'll add some conversion commands in the future...

