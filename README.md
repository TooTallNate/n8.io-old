n8.io
=====

The source code for https://n8.io, my blog.

I'm constantly rewriting / refactoring this silly little blog using
the latest and buzziest tech, so that I can stay up to date on these
libraries and frameworks. Current buzzwords:

 - React.js
 - JSX
 - Babel
 - ES2015
 - webpack
 - async functions


### Running

To run this blog locally, you will need a few external dependencies:

 - [Node.js][] v4 LTS ideally
 - [nginx][] (`brew install nginx`)
 - [mon][]
 - [mongroup][] (you'll need to use my fork which has the `mongroup names` subcommand)

Once those are installed, it takes a few commands to re-compile the script files,
restart the mongroup cluster, regenerate the nginx config file and finally reload
nginx's config:

``` bash
$ make                    # build all source files into the `build` dir
$ mongroup restart        # restart mongroup cluster
$ make nginx/server.conf  # build the `nginx/server.conf` with new port numbers
$ nginx -s reload         # standard way of hot-reloading nginx's config
```

The `nginx/server.conf.pre` file gets pre-processed by `m4` so that the individual
servers can bind to ephemeral ports which get compiled into the nginx config file.

The contents of the `nginx/server.conf` are meant to be used with the `include`
statement inside a `server {}` block in your nginx config file. For example,
local development could use something basic like:

``` nginx
server {
  listen 8080;
  server_name n8.io.localhost;

  include /ABSOLUTE/PATH/TO/n8.io/nginx/server.conf;
}
```

Production would use port 80, include SSL and port 443, use server name "n8.io",
etc…


[Node.js]: https://nodejs.org/
[nginx]: https://www.nginx.com/
[mon]: https://github.com/tj/mon
[mongroup]: https://github.com/TooTallNate/node-mongroup
