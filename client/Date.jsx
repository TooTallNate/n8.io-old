import React from 'react';
import strftime from 'strftime';

const utc = strftime.utc();

const UTCDate = ({ date }) => {
  const d = new Date(date);
  return (
    <span title={ utc('%B %d, %Y %H:%M UTC', d) }>
      { utc('%Y.%m.%d', d) }
    </span>
  );
}
UTCDate.displayName = 'UTCDate';
export default UTCDate;
