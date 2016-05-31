export default function reducer (state = null, { type, src, tag }) {
  switch (type) {
    case 'GIPHY_INVALIDATE':
      return null;
    case 'GIPHY_LOADING':
      return Object.assign({}, state, { isFetching: true });
    case 'GIPHY_LOADED':
      return Object.assign({}, state, { isFetching: false, src, tag });
    default:
      return state;
  }
}
