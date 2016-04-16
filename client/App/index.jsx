import React from 'react';
import ReactDOM from 'react-dom';
import request from 'superagent';
import InfiniteScrollFactory from 'react-infinite-scroll';

import Loading from '../Loading';
import Section from './section';
import ArticleStub from './stub';

const InfiniteScroll = InfiniteScrollFactory(React, ReactDOM);

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
    this.props.store.dispatch({
      type: 'POSTS_LOADED',
      total: res.body.total,
      articles: res.body.articles
    });
  },

  render() {
    const state = this.props.store.getState();
    const sorted = state.sorted || [];
    const articles = sorted.map((slug) => <ArticleStub article={ state.articles[slug] } key={ 'stub-' + slug } />);
    const pageStart = (articles.length / this.props.perPage) | 0;

    return (
      <div className="homepage">
        <Section name="about">
          <p>This is the blog of Nathan Rajlich &lt;n@n8.io&gt;.<br />Currently living in San Francisco, CA right by AT&T Park.</p>
        </Section>
        <Section name="status">
          <p>Currently a JavaScript engineer at <a href="https://automattic.com/about">Automattic</a> (formerly <a href="https://cloudup.com/blog/cloudup-automattic">Cloudup</a>), and having a blast revolutionizing the sharing scene!</p>
        </Section>
        <Section name="articles">
          <InfiniteScroll
              pageStart={ pageStart }
              loadMore={ this.loadMore }
              hasMore={ !state.doneLoading }
              loader={ <Loading maxDots={ 10 } speed={ 100 } /> }>
            { articles }
          </InfiniteScroll>
        </Section>
      </div>
    );
  }

});

export default App;
