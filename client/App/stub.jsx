import React from 'react';

import UTCDate from '../Date';

const ArticleStub = ({ article }) => {
  const date = new Date(article.date);
  return (
    <div className="article">
      <h4>
        <a href={ article.name + '/' }>{ article.title }</a>
        <UTCDate date={ date } />
      </h4>
      <div dangerouslySetInnerHTML={ { __html: article.desc } } ></div>
    </div>
  );
}
ArticleStub.displayName = 'ArticleStub';
export default ArticleStub;
