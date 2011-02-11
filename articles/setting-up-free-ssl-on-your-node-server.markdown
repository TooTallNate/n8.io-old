Title: Setting up free SSL on your Node server
Author: Nathan Rajlich
Date: Fri, 11 Feb 2011 00:59:08 GMT
Node: v0.4.0



Now that Node `v0.4.0` has finally stabalized, I was _very_ excited to try out the new
SSL supports that has landed. Specifically with the new `https` module. So I decided to
throw together a little walkthrough that goes through the process of setting up an HTTPS
server in Node, using a __FREE__ validated signed certificate from StartSSL.


## First, our regular "hello world" server

    function onConnection(req, res) {
      res.setHeader('Content-Type', 'text/plain');
      res.end("Hello World!\n");
    }
    require('http').createServer(onConnection).listen(80);

Consider this our "baseline" HTTP server. We're using the new `setHeader` API that has
been introduced in `v0.4.0`, so it looks a little different than the version on the
NodeJS homepage, however it acts exactly the same.

So our goal is to convert this into an HTTPS server using the brand new `https` API.

We won't be using a self-signed cert, since those make web browsers throw dramatic looking
warnings at the user saying that they're computer is going to be hacked if they continue.
So that route we want to avoid.

The "right" way to do it is to get an "officially" signed certificate through a "verified"
certificate company. The prices of these certificates _wildly_ varies between companies
and product tiers. But I was simply interested in getting rid of the annoying warning,
not so much about the "features" the certificate offered. Thus, a barebones, _free_ cert
from StartSSL is the way we're going.


## Register with StartSSL

You will need to register with them first. Use Firefox for this, since their registration
process involves installing a client certificate into your browser. This client cert is
only used when you log into their admin panel of their website.

Go ahead and register. Afterwards, you will be able to access their Control Panel.
First go through their "Validation Wizard" and set up "Email" and "Domain" validations.
This will involve responding to emails to verify that you are who you say you are.


## Generate a CSR

Once you're all validated, it's time to generate a certificate request. They offer an interface
on their website to generate one, but it's only two lines to do in theh Terminal:

    $ openssl genrsa -out ssl.key 2048

This first command generates the private key. It's private...

    $ openssl req -new -key ssl.key -out ssl.csr

The second command generates the CSR (Certificate Signing Request). You will be asked a
series of like 5 questions like country code among others. Just answer them truthfully.


## Send the CSR to StartSSL

Now this `ssl.csr` file that you have is what we need to send to StartSSL. Copy it's contents
to your clipboard. On OS X, this works:

    $ pbcopy < ssl.csr

Now on the StartSSL Control Panel, click "Certificate Wizard" and attempt to set up a
"Web Server SSL/TLS Certificate".

The first step attempts to generate a private key, but we did this on the command line
before, so press "Skip" at the bottom to skip this step.

So the next page is where you submit the Certificate Request. Paste the contents of your
clipboard from before into the text box provided. And then click "Continue".

The following page contains the signed certificate in a new text box. Copy all the contents
of the text box ("Select All...") and copy it to your clipboard. And then paste that
into a new file, let's call it `ssl.crt`. Again, on OS X, do it from Terminal:

    $ pbpaste > ssl.crt

Also at the bottom of the page are the intermediate certs and ca cert. They are needed as well,
so right click on them and "Save File As...". There are two files: `ca.pem` and
`sub.class1.server.ca.pem`.


## Putting it all together

Now we have all the files we need. A total of 5 should remain from the SSL cert creation process:

  * ssl.crt
  * ssl.csr
  * ssl.key
  * ca.pem
  * sub.class1.server.ca.pem

All that's needed now is to add use these files with the new `https` module in Node. Here's
a refactoring of our baseline "hello world" server from above:

    function onConnection(req, res) {
      res.setHeader('Content-Type', 'text/plain');
      res.end("Hello World!\n");
    }
    var options = {
      ca:   fs.readFileSync('sub.class1.server.ca.pem'),
      key:  fs.readFileSync('ssl.key'),
      cert: fs.readFileSync('ssl.crt')
    };
    require('https').createServer(options, onConnection).listen(443);

Aaaahhhhhhhh, nice and simple. Just like you would expect from Node. So with the addition
of an `options` object, and a very simple change to the final line (note we're not listening
on port 80 anymore!), we've converted the standard HTTP hello world into a signed HTTPS hello
world.

## Try it out!

So lets start the server:

    $ sudo node server.js

And in another terminal, we can `curl` it:

    $ curl https://localhost
    // Hello World!

Notice how we don't need the `-k` or `--insecure` switches anymore? That's the result of
creating a signed cert over a self-signed cert.

You can also try it in the web browser. Just open `https://localhost` or your IP address
the address bar, and you should see it work!


## Conclusion

The new SSL stuff in Node `v0.4.0` is _awesome_! In other words, this will make my employer
very happy, and probably yours too!

I upgraded this blog to HTTPS as a proof-of-concept, and to try out the new APIs. So far
I am very pleased with the results.

I've just given you the baseline, now it's your job to build on top of that!
