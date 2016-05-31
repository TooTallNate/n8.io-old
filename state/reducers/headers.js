export default function headers (state = {}, action) {
  switch (action.type) {
    case 'SET_RESPONSE_HEADER':
      return Object.assign({}, state, { [ action.name ]: action.value });
    default:
      return state;
  }
}
