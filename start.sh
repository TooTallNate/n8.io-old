#!/bin/sh

# This is an wasy way to start the server in the background.
# Meant for use in production on a linux server.
export LD_LIBRARY_PATH=/root/libgit2/build
export NODE_ENV=production
export N8_IO_PORT=3000
node server.js extra args needed for process title </dev/null >/dev/null 2>&1 &
