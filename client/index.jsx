// Common routing logic used on the client-side and server-side.
// The client-side entry point is `client/main.jsx`.
// The server-side rendering server is `server/render.jsx`.

import React from 'react';
import DEBUG from 'debug';
import { Provider } from 'react-redux'

import App from './App';
import ArticleLoader from './ArticleLoader';

const debug = DEBUG('n8.io:client:index');

export default function (ctx) {
  debug('ctx: %o', ctx);

  let el;
  if (ctx.path === '/') {
    el = <App />;
  } else {
    const slug = ctx.path.match(/^\/([^\/]*)\/?$/)[1];
    el = <ArticleLoader slug={ slug } />;
  }

  return <Provider store={ ctx.store }>{ el }</Provider>;
};
