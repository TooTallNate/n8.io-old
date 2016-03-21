import React from 'react';
import request from 'superagent';

import Loading from './Loading';
import Article from './Article';

const ArticleLoader = React.createClass({
  componentWillMount() {
    const store = this.props.store;
    this.unsubscribe = store.subscribe(this.forceUpdate.bind(this));

    const state = store.getState();

    this.slug = this.props.ctx.path.match(/^\/([^\/]*)\/?$/)[1];
    if (!this.getArticle(this.slug, state) && !state.done) {
      this.loadArticle(this.slug);
    }
  },

  componentWillUnmount() {
    this.unsubscribe();
  },

  loadArticle(slug) {
    request
      .get('/articles.json')
      .query({ slug: slug })
      .end(this.onLoad);
  },

  getArticle(slug, state = this.props.store.getState()) {
    const articles = state.articles;
    return articles && articles[slug];
  },

  onLoad(err, res) {
    if (err) throw err;
    const store = this.props.store;
    const state = store.getState();
    const loaded = state.articles ? Object.keys(state.articles).length : 0;

    if (res.body.articles.length === 0) {
      // slug name is not a valid blog post slug,
      // continue through to the `404` handler
      this.props.next();
    } else {
      var $set = {
        done: res.body.total === res.body.articles.length + loaded,
      };
      res.body.articles.forEach(function (article) {
        $set['articles.' + article.name] = article;
      });
      var op = {
        $set: $set,
        type: 'MONGO_UPDATE'
      };
      console.log(op);

      store.dispatch(op);
    }
  },

  render() {
    const article = this.getArticle(this.slug);
    if (article) {
      return <Article article={ article } />;
    } else {
      return <Loading maxDots={ 10 } speed={ 100 } />;
    }
  }
});
export default ArticleLoader;
