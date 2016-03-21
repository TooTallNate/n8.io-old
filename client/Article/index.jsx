import React from 'react';

import UTCDate from '../Date';
import DisqusThread from './DisqusThread';

const Article = React.createClass({
  componentWillMount() {
    document.title = `${this.props.article.title} - n8.io`;
  },

  handleNewComment(event) {
    console.log('new comment!', event);
  },

  render() {
    const article = this.props.article;
    return (
      <div className="article-wrapper">
        <div className="article-title">
          <h1>{ article.title }</h1>
          <strong>Published: <UTCDate date={ article.date } /></strong>
        </div>
        <div className="article" dangerouslySetInnerHTML={ { __html: article.html } } >
        </div>
        <DisqusThread
          shortname="tootallnate"
          title={ article.title }
          url={ 'http://n8.io/' + article.name }
          onNewComment={ this.handleNewComment } />
      </div>
    );
  }
});
export default Article;
