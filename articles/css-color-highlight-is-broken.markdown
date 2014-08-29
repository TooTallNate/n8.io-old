Title: CSS `color: Highlight` is broken
Date: Fri, 29 Aug 2014 21:43:22 GMT

[CSS2](http://www.w3.org/TR/CSS2/) defined a concept of
[System Colors](http://www.w3.org/TR/CSS2/ui.html#system-colors), which allowed
the web page author to leverage colors defined by the operating system. This made
emulating native OS controls possible within the page.

Unfortunately, System Colors were quickly deprecated in the next version of CSS,
[CSS3](http://www.w3.org/TR/2010/PR-css3-color-20101028/#css-system), and through
the process of manual testing, I've discovered that two of these system colors
are horribly broken across browsers and operating systems.

I'm talking about **Highlight** and **HighlightText**.

<p style="color: black;">
  <span style="background-color: Highlight; color: HighlightText;">Here is some
  text</span> with that CSS applied on <code>background-color</code> and
  <code>color</code>, respectively.
  <br />
  <span id="select-me">Here is some text</span> with the OS native selection
  applied. It may, or may not, match what you see on the line above.
</p>

<script src="select-span.js"></script>

More testing and screenshots to come...
