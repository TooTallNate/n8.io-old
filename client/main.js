import page from 'page';
import { render } from 'react-dom';
import { createStore } from 'redux';

import client from './index';
import reducer from '../state/reducers';

const target = document.getElementById('body');

const store = createStore(reducer, window.__initialState__);

// XXX: debug, remove soon
window.page = page;

page('*', function (ctx) {
  ctx.store = store;
  ctx.preload = false;
  const el = client(ctx);
  render(el, target);
});

page.start();
