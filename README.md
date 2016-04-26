n8.io
=====

The source code for https://n8.io, my blog.

I'm constantly rewriting / refactoring this silly little blog using
the latest and buzziest tech, so that I can stay up to date on these
libraries and frameworks. Current buzzwords:

 - React.js
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

Once those are installed, running `make` will build all the necessary files,
and start the mongroup cluster.

The `nginx/server.conf.pre` file gets pre-processed by `m4` so that the individual
servers can bind to ephemeral ports which get compiled into the nginx config file.

The contents of the `nginx/server.conf` are meant to be used with the `include`
clause inside a `server {}` block in your nginx config file. For example, for
local development:

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
