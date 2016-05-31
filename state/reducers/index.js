import { combineReducers } from 'redux';

import articles from './articles';
import giphy from './giphy';
import headers from './headers';
import loading from './loading';
import statusCode from './statusCode';

export default combineReducers({
  articles,
  giphy,
  headers,
  loading,
  statusCode
});
