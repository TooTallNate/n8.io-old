import React from 'react';
import ReactMarkdown from 'react-markdown';
import HtmlToReact from 'html-to-react';
import { highlight } from 'highlight.js';

import UTCDate from '../Date';
import DisqusThread from './DisqusThread';

/**
 * Languange aliases.
 */

const aliases = new Map();
aliases.set('js', 'javascript');

/**
 * CodeBlock
 *
 * Goes through `highlight.js` to add highlighting markup
 * class names, and then wraps in a CODE and PRE block.
 *
 * The final result HTML is sent through the `HtmlBlock`
 * parser to be rendered to proper React element instances.
 */

const CodeBlock = (props) => {
  console.log('CodeBlock:', props);
  let html;
  let lang = props.language;
  if (lang) {
    if (aliases.has(lang)) lang = aliases.get(lang);
    html = highlight(lang, props.literal).value;
  } else {
    html = props.literal;
  }
  let literal = `<pre><code${ lang ? ' class="lang-' + lang + '"' : '' }>${ html }</code></pre>`;
  return HtmlBlock({ literal });
};

/**
 * HtmlBlock
 *
 * Goes through the `html-to-react` parser to conver the raw HTML
 * into React element instances.
 *
 * This avoids the use of `dangerouslySetInnerHTML` entirely, while
 * still allowing raw HTML to be rendered, which is a Good Thing™.
 */

const HtmlToReactParser = new HtmlToReact.Parser(React);
const HtmlBlock = (props) => {
  console.log('HtmlBlock:', props);
  const el = HtmlToReactParser.parse(props.literal);
  console.log(el);
  return el;
};



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
        <div className="article">
          <ReactMarkdown
            renderers={ { CodeBlock, HtmlBlock } }
            source={ article.markdown } />
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
