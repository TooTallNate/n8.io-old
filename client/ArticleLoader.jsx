import React from 'react';
import request from 'superagent';

import Loading from './Loading';
import Article from './Article';

const ArticleLoader = React.createClass({
  componentWillMount() {
    const store = this.props.store;
    this.unsubscribe = store.subscribe(this.forceUpdate.bind(this));

    this.loadArticle(this.props.slug);
  },

  componentWillUnmount() {
    this.unsubscribe();
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.slug !== this.props.slug) {
      this.loadArticle(nextProps.slug);
    }
  },

  loadArticle(slug, state = this.props.store.getState()) {
    if (!this.getArticle(slug, state) && !state.doneLoading) {
      request
        .get('/articles.json')
        .query({ slug: slug })
        .end(this.onLoad);
    }
  },

  getArticle(slug, state = this.props.store.getState()) {
    const articles = state.articles;
    return articles && articles[slug];
  },

  onLoad(err, res) {
    if (err) throw err;
    if (res.body.articles.length === 0) {
      // slug name is not a valid blog post slug,
      // continue through to the `404` handler
      this.props.next();
    } else {
      this.props.store.dispatch({
        type: 'POSTS_LOADED',
        total: res.body.total,
        articles: res.body.articles
      });
    }
  },

  render() {
    const article = this.getArticle(this.props.slug);
    if (article) {
      return <Article article={ article } slug={ this.props.slug } />;
    } else {
      return <Loading maxDots={ 10 } speed={ 100 } />;
    }
  }
});
export default ArticleLoader;
