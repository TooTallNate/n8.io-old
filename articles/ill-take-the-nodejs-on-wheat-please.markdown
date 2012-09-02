Title: I'll Take the Node.js on Wheat, Please!
Author: Nathan Rajlich
Date: Tue Jun 30 2010 12:04:52 GMT-0700 (PDT)


Ok, well this is gonna be the first blog entry on `TooTallNate.net`.
And while there's nothing else here, it's probably a good time to talk
about what's powering this blog, because I think it's pretty awesome!

Let me first start off by saying that I love JavaScript! It's growth
and credibility earned over the past couple years has been really
exciting for me. For any programming related challenge, I always
consider how I could solve it with JavaScript first.


## V8

In my opinion, the single most important piece of software related to
the growth of JavaScript as of recent has to be the [V8 JavaScript Engine][V8],
developed by Google. As a web developer, V8 initially earned my respect
once Google Chrome was released and all of the sudden my web apps were
flying like never before. Even as an initial release, the JavaScript
engine was soaring past literally every other JavaScript engine in existence!

At the time, I would consider myself a _Windows_ guy. I had a server running
Windows Server 2008, IIS7, and ASP.NET. Overall I was pretty happy running
the _old_ TooTallNate.net site.

Since then I have been completely converted to the light side (of Unix),
but wasn't too pleased about having to learn the ins-and-outs of Apache
or PHP (no offense, it's just that I was so fluent is ASP at the time).
And for those reasons, I've avoided any web hosting on Linux... until now...


## Node.js

One day a few months ago, I came across [Node.js][]. Node embeds [V8][],
but also offers an additional evented I/O [API](http://nodejs.org/api.html).
The API provides file system operations, low-level raw socket operations, a
rock solid (still low-level) HTTP implementation, and plenty more. And what's
the best part? Everything is coded in JavaScript!

When I came across this I just knew I had to use it for something. Maybe my
next HTTP server, maybe something else. At the time I wasn't quite sure.
What I did quickly find Node.js useful for was shell scripts. My proficiency
in JavaScript leads me to be able to do almost whatever I want when I comes
writing a quick script. For example:

``` javascript
var http = require('http'),
    fs = require('fs'),
    querystring = require('querystring');

var request = http.createClient(80, 'closure-compiler.appspot.com').request('POST', '/compile', {
    'Host': 'closure-compiler.appspot.com',
    'Content-Type': 'application/x-www-form-urlencoded'
});

request.write(querystring.stringify({
    'compilation_level': 'ADVANCED_OPTIMIZATIONS',
    'output_format': 'json',
    'output_info': ['compiled_code', 'warnings', 'errors', 'statistics'],
    'js_code': fs.readFileSync(__dirname + "/src/Main.js")
}, '&', '=', false));

request.addListener('response', function (response) {
    var res = "";
    response.setEncoding('utf8');
    response.addListener('data', function (chunk) {
        res += chunk;
    });
    response.addListener('end', function () {
        var compiledCode = JSON.parse(res).compiledCode;
        fs.writeFileSync(__dirname + "/dist/Main.js", compiledCode);
    });
});

request.end();
```

The snippet above will read the contents of a file into memory, send it
off to the [Google Closure Compiler](http://code.google.com/closure/compiler/docs/api-ref.html)
web service, and store the result into another file, all using Node.js's
built-in HTTP client and file system APIs.

I could have (_maybe_) written the equivalent in Bash, but:

  1. Would have to constantly look up Bash syntax for functions, loops, etc.
  2. Would have to use `curl` as an external dependency on the script, and
     look up it's syntax as well (likely forgetting immediately after it
     starts working right).
  3. URL-encoding the body of the script file in Bash is most easily done
     using for example Python. So we'd might as well do the whole process in
     an interpreter to simplify things.
  4. Would have been cursing to the computer gods how I wish I could be doing
     it in JavaScript...

Node can also invoke arbitrary (child) processes and do fancy things with
their input, output, and error streams. In a modified version of the
`compile.js` script above I use, I invoke the [HaXe](http://haxe.org) compiler
to simply compile `.hx` source files into a Flash `.swf`.

Another Node enthusiast, [Tim Caswell](http://creationix.com), had a better
use case for child processes: [Git][]. Tim combined the idea of server-side
JavaScript (Node) with the only version control software that matters (Git),
to create a sweet piece of blogging software with a cool concept...


## Wheat

I don't quite know where the name came from, but the very web site that you
see before you is being powered by [Wheat][]. I think regardless of what type
of project I'm working on, I almost always use [Git][] for version control.
Well Wheat is cool because it reads the internals of said Git repository in
order to provide some nice features to the blog's articles like seamless
revisions.

In practice, this means that I write a simple text file (well Markdown
actually), and commit it to my repo the same as I always would, and Wheat
takes care of dynamically creating the article. Any updates to the article
I can just manually change and commit like usual, and Wheat automatically
takes care of adding links to the article for each revision. I like things
being effortless on my part.

Speaking of effortless, the getting a properly formatted Wheat Git repo up and
going properly takes a little bit of guess work at this point, as there isn't
very much documentation. But as Wheat is already using a few of my favorite
technologies, I was able to get the ball rolling pretty easy. Tim basically
says clone the [howtonode.org repo](http://github.com/creationix/howtonode.org)
(which powers [HowToNode.org](http://howtonode.org)) and figure it out from
there. FWIW, I haven't messed around too much with the layout of the site, so
it's still pretty similar, mostly due to my laziness. I'll play around with
the looks in more detail someday...

Overall though, I'd say that so far I really like Wheat, and I'm glad that I
finally have a place to document the crap I'm working on and whatnot. See ya!


[git]: http://git-scm.com/
[node.js]: http://nodejs.org/
[V8]: http://code.google.com/apis/v8/
[Wheat]: http://github.com/creationix/wheat
