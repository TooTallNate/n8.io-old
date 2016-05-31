import React from 'react';
import { connect } from 'react-redux';
import DEBUG from 'debug';

const debug = DEBUG('n8.io:client:status-code');

/**
 * This is a dummy component that you can render into your own components
 * to set the prerender server-side "status code" for the HTTP response.
 *
 * Usage:
 *
 *     <StatusCode code={ 404 } />
 */

const StatusCode = ({ statusCode, setStatusCode }) => {
  setStatusCode(statusCode);
  return null;
}

const mapDispatchToProps = (dispatch) => {
  return {
    setStatusCode(statusCode) {
      debug('setting status code: %o', statusCode);
      dispatch({
        type: 'SET_STATUS_CODE',
        statusCode
      });
    }
  };
}

export default connect(null, mapDispatchToProps)(StatusCode);
