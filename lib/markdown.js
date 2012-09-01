
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
    return hljs.highlight(lang, code).value;
  } else {
    //return hljs.highlightAuto(code).value;
    return code;
  }
}
