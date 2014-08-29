
var span = document.getElementById('select-me');

var range = document.createRange();
range.selectNodeContents(span);

var selection = window.getSelection();
selection.removeAllRanges();
selection.addRange(range);
