import query from 'mongo-query';
import deepClone from 'deep-clone';

export default function reducer (state, action) {
  if (!state) return {};
  const newState = deepClone(state);
  const result = query(newState, {}, action);
  //console.log(result);
  return newState;
}

/*
var store = redux.createStore(reducer);

store.subscribe(function () {
  console.log(store.getState());
});

store.dispatch({ $set: { foo: 'bar' }, type: 'mongo-query' });
store.dispatch({ $unset: { foo: 1 }, $set: { a: new Date() }, type: 'mongo-query' });
*/
