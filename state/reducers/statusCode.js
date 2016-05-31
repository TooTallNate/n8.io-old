export default function statusCode (state = null, action) {
  switch (action.type) {
    case 'SET_STATUS_CODE':
    case 'SET_RESPONSE_HEADER':
      return parseInt(action.statusCode, 10) || state;
    default:
      return state;
  }
}
