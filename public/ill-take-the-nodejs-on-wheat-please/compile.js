#!/usr/bin/env node

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
