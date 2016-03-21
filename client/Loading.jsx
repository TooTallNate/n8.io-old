import React from 'react';

const Loading = React.createClass({
  propTypes: {
    maxDots: React.PropTypes.number.isRequired,
    speed: React.PropTypes.number.isRequired
  },

  componentWillMount() {
    this.timeout = setInterval(this.tick, this.props.speed);
  },

  componentWillUnmount() {
    clearInterval(this.timeout);
  },

  getInitialState() {
    return {
      dots: 0
    }
  },

  tick() {
    const dots = (this.state.dots + 1) % (this.props.maxDots + 1);
    this.setState({
      dots: dots
    });
  },

  render() {
    const dots = Array(this.state.dots + 1).join('.')
    return <div className="loading">loading{ dots }</div>;
  }
});
export default Loading;
