import React from 'react';
import strftime from 'strftime';

const utc = strftime.utc();

const UTCDate = ({ date }) => {
  return (
    <span title={ utc('%B %d, %Y %H:%M UTC', date) }>
      { utc('%Y.%m.%d', date) }
    </span>
  );
}
UTCDate.displayName = 'UTCDate';
export default UTCDate;
