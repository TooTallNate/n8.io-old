import fs from 'fs';

function promisify (fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      args.push((err, val) => err ? reject(err) : resolve(val));
      fn.apply(this, args);
    });
  }
}

export const stat = promisify(fs.stat);
export const readdir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
