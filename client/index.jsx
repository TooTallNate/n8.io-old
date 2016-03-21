import page from 'page';
import React from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux';

import App from './App';
import ArticleLoader from './ArticleLoader';
import NotFound from './NotFound';
import reducer from './reducer';

const body = document.getElementById('body');

const store = createStore(reducer, window.__initialStore__);
window.store = store;

page('/', function () {
  render(<App store={ store } />, body);
});

// check for an article "slug"
page('*', function (ctx, next) {
  render(<ArticleLoader store={ store } ctx={ ctx } next={ next } />, body);
});

// 404
page('*', function (ctx) {
  render(<NotFound path={ ctx.path } />, body);
});

page.start();
