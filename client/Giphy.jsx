import React from 'react';
import request from 'superagent';
import without from 'without-keys';

const Giphy = React.createClass({
  propTypes: {
    tag: React.PropTypes.string,
    search: React.PropTypes.string,
    key: React.PropTypes.string,
    api: React.PropTypes.string,
  },

  getDefaultProps() {
    return {
      key: 'dc6zaTOxFJmzC',
      api: 'https://api.giphy.com/v1/',
    }
  },


  getInitialState() {
    return {};
  },

  componentWillMount() {
    if (this.props.search) {
      this.gifSearch(this.props.search);
    } else {
      this.gifRandom(this.props.tag);
    }
  },

  gifRandom(tag) {
    const query = { api_key: this.props.key };
    if (tag) query.tag = tag;
    request
      .get(this.props.api + 'gifs/random')
      .query(query)
      .end((err, res) => {
        var gifUrl = res.body.data.image_url;
        if (res.body.meta.status == 200 && gifUrl) {
          this.setState({
            gif: gifUrl
          });
        }
      });
  },

  gifSearch(keywords) {
    const query = {
      api_key: this.props.key,
      q: keywords
    };
    request
      .get(this.props.api + 'gifs/search')
      .query(query)
      .end((err, res) => {
        var gifUrl = res.body.data[0].images.downsized.url;
        if (res.body.meta.status == 200 && gifUrl) {
          this.setState({
            gif: gifUrl
          });
        }
      });
  },

  render() {
    const props = without(this.props, ['tag', 'search', 'key']);
    props.src = this.state.gif;
    props.style = {
      display: 'block',
      margin: '10px auto',
      maxWidth: '100%'
    };
    return <img {...props} />;
  }

});
export default Giphy;
