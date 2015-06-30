var appengine = require('appengine');
var crypto = require('crypto');
var express = require('express');
var mathjax = require('MathJax-node/lib/mj-single');

mathjax.config({
  MathJax: {
    SVG: {
      font: 'STIX-Web'
    },
    displayAlign: 'left',
    displayIndent:'3em',
    tex2jax: {
      preview: ['[math]'],
      processEscapes: true,
      inlineMath: [['$','$'], ['\\(','\\)']],
      displayMath: [['$$','$$'], ['\\[','\\]']],
      skipTags: ['script','noscript','style','textarea','pre','code']
    },
    TeX: {
      noUndefined: {disabled: true},
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
             '<p><img height="50" src="/' + encodeURIComponent(example) + '"></p>\n' +
             '<p><code>&lt;img height="50" src=&quot;http://tex.la<span id="path">/' + encodeURIComponent(example) + '</span>&quot;&gt;</code></p>\n' +
             '<p><a href="https://github.com/blixt/tex.la">Source code on GitHub</a></p>\n' +
             '<script>\n' +
             'document.querySelector(\'input\').onchange = function () {\n' +
             '  var path = \'/\' + encodeURIComponent(this.value);\n' +
             '  document.querySelector(\'#path\').textContent = path;\n' +
             '  document.querySelector(\'img\').src = path;\n' +
             '};\n' +
             '</script>';

  res.send(html);
});

app.get('/*', function (req, res) {
  var math = decodeURIComponent(req.url.substr(1));
  mathjax.typeset({math: math, svg: true}, function (result) {
    if (result.errors) {
      res.set('Content-Type', 'text/plain');
      res.status(400).send('Error 400: Request Failed.\n' + result.errors + '\n' + math);
      return;
    }
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'image/svg+xml',
      'ETag': crypto.createHash('md5').update(math).digest('base64')
    });
    res.send(result.svg);
  });
});

app.listen(8080, '0.0.0.0');
