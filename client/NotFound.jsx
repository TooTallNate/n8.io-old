import React from 'react';

import Giphy from './giphy';

const NotFound = ({ path }) => {
  let img;
  return (
    <div className="not-found">
      <h3>Sorry, but the page:</h3>
      <div><code>{ path }</code></div>
      <h2>Does not exist!</h2>
      <Giphy tag="cat" />
    </div>
  );
}
NotFound.displayName = 'NotFound';
export default NotFound;
