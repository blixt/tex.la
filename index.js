var appengine = require('appengine');
var crypto = require('crypto');
var express = require('express');
var mathjax = require('MathJax-node/lib/mj-single');

var pkg = require('./package.json');

var EX_TO_PX_RATIO = 7.3749;

mathjax.config({
  MathJax: {
    SVG: {
      font: 'STIX-Web'
    },
    TeX: {
      noUndefined: {disabled: true}
    }
  }
});
mathjax.start();

var app = express();
app.use(appengine.middleware.base);

app.get('/_ah/health', function (req, res) {
  res.set('Content-Type', 'text/plain');
  res.send('ok');
});

app.get('/_ah/start', function (req, res) {
  res.set('Content-Type', 'text/plain');
  res.send('ok');
});

app.get('/_ah/stop', function (req, res) {
  res.set('Content-Type', 'text/plain');
  res.send('ok');
  process.exit();
});

app.get('/', function (req, res) {
  var example = 'x = \\sum\\limits_{i=1}^n i^2';

  res.set('Content-Type', 'text/html');
  var html = '<h1>TeX.La (LaTeX)</h1>\n' +
             '<p><input value="' + example + '" size="50"> <button>Update</button></p>\n' +
             '<p><img src="/' + encodeURIComponent(example) + '"></p>\n' +
             '<p><code>&lt;img src=&quot;http://tex.la<span id="path">/' + encodeURIComponent(example) + '</span>&quot;&gt;</code></p>\n' +
             '<p><a href="https://github.com/blixt/tex.la">Source code on GitHub</a></p>\n' +
             '<script>\n' +
             'var input = document.querySelector(\'input\');\n' +
             'input.onchange = function () {\n' +
             '  var path = \'/\' + encodeURIComponent(input.value);\n' +
             '  document.querySelector(\'#path\').textContent = path;\n' +
             '  document.querySelector(\'img\').src = path;\n' +
             '};\n' +
             'input.onchange();\n' +
             '</script>';

  res.send(html);
});

app.get('/*', function (req, res) {
  var math = decodeURIComponent(req.url.substr(1));

  var etag = '"' + crypto.createHash('md5').update(pkg.version + math).digest('base64') + '"';
  if (req.get('If-None-Match') == etag) {
    res.status(304).end();
    return;
  }

  mathjax.typeset({math: math, img: true, svg: true}, function (result) {
    if (result.errors) {
      res.set('Content-Type', 'text/plain');
      res.status(400).send('Error 400: Request Failed.\n' + result.errors + '\n' + math);
      return;
    }
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'image/svg+xml',
      'ETag': etag
    });
    var svg = result.svg;
    var match = svg.match(/ width="([^"]+)ex" height="([^"]+)ex"/);
    if (match) {
      var newAttributes = '';
      //newAttributes += ' width="' + (parseFloat(match[1]) * EX_TO_PX_RATIO) + 'px"';
      newAttributes += ' height="' + Math.ceil(parseFloat(match[2]) * EX_TO_PX_RATIO) + 'px"';
      svg = svg.substr(0, match.index) + newAttributes + svg.substr(match.index + match[0].length);
    }
    res.send(svg);
  });
});

app.listen(8080, '0.0.0.0');
