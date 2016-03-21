import React from 'react';
import without from 'without-keys';

const Section = (_props) => {
  var name = _props.name;
  const props = without(_props, ['name']);

  return (
    <div className={ name.toLowerCase() } { ...props }>
      <h3>{ name }</h3>
      { props.children }
    </div>
  );
};
Section.displayName = 'Section';

export default Section;
