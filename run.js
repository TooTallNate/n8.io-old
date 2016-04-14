import minimist from 'minimist';
import { writeFileSync as write, unlinkSync as unlink } from 'fs';
import { createServer } from 'http';
import { isAbsolute, resolve } from 'path';
import { readable as isReadableStream } from 'is-stream';

const argv = minimist(process.argv.slice(2));

let filename = argv._.shift();
let port = argv.port || parseInt(process.env.PORT, 10) || 0;

if (!filename) {
  throw new Error('A server filename must be given!');
}

if (Number.isNaN(port)) {
  throw new Error('PORT env variable must be set!');
}

if (!isAbsolute(filename)) {
  filename = resolve(filename);
}

let mod = require(filename);
if (mod.default) mod = mod.default;

export function makeEnumerableError (err) {
  const copy = {};
  copy.name = err.name;
  copy.message = err.message;
  Object.keys(err).forEach((k) => copy[k] = err[k]);
  if (copy.stack) copy.stack = undefined;
  return copy;
}

const server = createServer((req, res) => {
  function onResponse (val) {
    if (!val) return res.end();
    if (isReadableStream(val)) return val.pipe(res);

    let length;
    if (Buffer.isBuffer(val)) {
      length = val.length;
    } else if ('object' === typeof val) {
      // assume a plain object, JSON stringify
      val = JSON.stringify(val, null, 2);
      res.setHeader('Content-Type', 'application/json; charset=utf8');
    }

    if ('string' === typeof val) {
      length = Buffer.byteLength(val);
    }
    if ('number' === typeof length) {
      res.setHeader('Content-Length', length);
    }
    res.end(val);
  }

  function onError (err) {
    const code = err.statusCode || 500;

    if (code < 400 || code >= 500) {
      // print non-4xx stack traces to the server log
      console.error(err.stack);
    }

    res.statusCode = code;

    // Error will be JSON stringified in response
    onResponse(makeEnumerableError(err));
  }

  mod(req, res).then(onResponse, onError);
});

server.listen(port, (err) => {
  if (err) throw err;
  port = server.address().port;
  console.log('listening on port %d', port);
  process.title = 'n8.io:' + port + ': ' + process.title;
  write('ports/' + process.name, String(port), 'ascii');
});

// simply log unhandled rejections, like Chrome does
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled promise rejection:\n' + err.stack);
});

// delete the "ports" file
process.on('SIGQUIT', () => {
  console.log('SIGQUIT');
  process.exit();
});

process.on('exit', () => {
  console.log('exit');
  try {
    unlink('ports/' + process.name);
  } catch (e) {
    console.error(e.stack);
  }
});
