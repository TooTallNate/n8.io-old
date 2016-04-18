import React from 'react';

import UTCDate from '../Date';

const ArticleStub = ({ article }) => {
  return (
    <div className="article">
      <h4>
        <a href={ `${ article.name }/` }>{ article.title }</a>
        <UTCDate date={ article.date } />
      </h4>
      <div dangerouslySetInnerHTML={ { __html: article.preview } } ></div>
    </div>
  );
}
ArticleStub.displayName = 'ArticleStub';
export default ArticleStub;
