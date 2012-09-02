
/**
 * Module dependencies.
 */

var marked = require('marked');
var hljs = require('highlight.js');

/**
 * Module exports.
 */

module.exports = markdown;

/**
 * Languange aliases.
 */

var aliases = {
  'js': 'javascript'
};

/**
 * Parses Markdown into highlighted HTML.
 * Enable Github Flavored Markdown.
 */

function markdown (code) {
  if (!code) return code;
  return marked(code, {
    gfm: true,
    highlight: highlight
  });
}

/**
 * Add syntax highlighting HTML to the given `code` block.
 */

function highlight (code, lang) {
  if (lang) {
    return hljs.highlight(aliases[lang] || lang, code).value;
  } else {
    //return hljs.highlightAuto(code).value;
    return code;
  }
}
