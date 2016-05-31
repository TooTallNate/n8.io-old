export default function reducer (state = [], action) {
  if ('LOADING_RESET' === action.type) {
    return [];
  } else if (/_LOADING$/.test(action.type)) {
    return [ ...state, action.promise ];
  } else {
    return state;
  }
}
