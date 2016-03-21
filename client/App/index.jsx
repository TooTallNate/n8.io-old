import React from 'react';
import request from 'superagent';
import InfiniteScrollFactory from 'react-infinite-scroll';

import Loading from '../Loading';
import Section from './section';
import ArticleStub from './stub';

const InfiniteScroll = InfiniteScrollFactory(React);

const App = React.createClass({
  propTypes: {
    perPage: React.PropTypes.number.isRequired
  },

  getDefaultProps() {
    return {
      perPage: 3
    };
  },

  getInitialState() {
    return {};
  },

  componentWillMount() {
    document.title = 'n8.io';

    const store = this.props.store;
    this.unsubscribe = store.subscribe(this.forceUpdate.bind(this));
  },

  componentWillUnmount() {
    this.unsubscribe();
  },

  loadMore(pageNum) {
    const state = this.props.store.getState();
    const perPage = this.props.perPage;
    request
      .get('/articles.json')
      .query({ start: (pageNum - 1) * perPage, count: perPage })
      .end(this.onLoad);
  },

  onLoad(err, res) {
    if (err) throw err;
    const store = this.props.store;
    const state = store.getState();
    const loaded = state.articles ? Object.keys(state.articles).length : 0;

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

    store.dispatch(op);
  },

  render() {
    const state = this.props.store.getState();
    const slugs = Object.keys(state.articles || {});
    const articles = slugs.map(function (slug) {
      return state.articles[slug];
    });
    const pageStart = (slugs.length / this.props.perPage) | 0;

    return (
      <div className="homepage">
        <Section name="about">
          <p>This is the blog of Nathan Rajlich &lt;n@n8.io&gt;.<br />Currently living in San Francisco, CA right by AT&T Park.</p>
        </Section>
        <Section name="atatus">
          <p>Currently a JavaScript engineer at <a href="https://automattic.com/about">Automattic</a> (formerly <a href="https://cloudup.com/blog/cloudup-automattic">Cloudup</a>), and having a blast revolutionizing the sharing scene!</p>
        </Section>
        <Section name="articles">
          <InfiniteScroll
              pageStart={ pageStart }
              loadMore={ this.loadMore }
              hasMore={ !state.done }
              loader={ <Loading maxDots={ 10 } speed={ 100 } /> }>
            { articles.map((article) => <ArticleStub article={ article } key={ 'stub-' + article.name } />) }
          </InfiniteScroll>
        </Section>
      </div>
    );
  }

});

export default App;
