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
 - [mongroup][]

Once those are installed, running `make` will build all the necessary files,
and start the mongroup cluster.

The `nginx/server.conf.pre` file gets pre-processed by `m4` so that the `port` and
`server_name` can be dynamic. For example, to generate a `nginx/server.conf` file
that binds to port 8080 and uses server name "n8io.localhost":

``` bash
$ make nginx/server.conf PORT=8080 SERVER_NAME=n8io.localhost
```


[Node.js]: https://nodejs.org/
[nginx]: https://www.nginx.com/
[mon]: https://github.com/tj/mon
[mongroup]: https://github.com/tj/node-mongroup
