var appengine = require('appengine');
var crypto = require('crypto');
var express = require('express');
var mathjax = require('MathJax-node/lib/mj-single');

var pkg = require('./package.json');

var EX_TO_PX_RATIO = 7.3749;
function renderToSVG(latex, callback) {
  mathjax.typeset({math: latex, img: true, svg: true}, function (result) {
    if (result.errors) {
      callback(result.errors, null);
      return;
    }
    var svg = result.svg;
    var match = svg.match(/ width="([^"]+)ex" height="([^"]+)ex"/);
    if (match) {
      var newAttributes = '';
      //newAttributes += ' width="' + (parseFloat(match[1]) * EX_TO_PX_RATIO) + 'px"';
      newAttributes += ' height="' + Math.ceil(parseFloat(match[2]) * EX_TO_PX_RATIO) + 'px"';
      svg = svg.substr(0, match.index) + newAttributes + svg.substr(match.index + match[0].length);
    }
    callback(null, svg);
  });
}

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
  res.sendFile(__dirname + '/index.html');
});

function handleRenderRequest(latex, req, res) {
  // Check ETag so that clients don't need to redownload SVG.
  var etag = '"' + crypto.createHash('md5').update(pkg.version + latex).digest('base64') + '"';
  if (req.get('If-None-Match') == etag) {
    res.status(304).end();
    return;
  }

  renderToSVG(latex, function (error, svg) {
    if (error) {
      res.set('Content-Type', 'text/plain');
      res.status(400).send('There was an error:\n\n' + error + '\n\nInput:\n\n' + math);
      return;
    }
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'image/svg+xml',
      'ETag': etag
    });
    var match = svg.match(/ width="([^"]+)ex" height="([^"]+)ex"/);
    if (match) {
      var newAttributes = '';
      //newAttributes += ' width="' + (parseFloat(match[1]) * EX_TO_PX_RATIO) + 'px"';
      newAttributes += ' height="' + Math.ceil(parseFloat(match[2]) * EX_TO_PX_RATIO) + 'px"';
      svg = svg.substr(0, match.index) + newAttributes + svg.substr(match.index + match[0].length);
    }
    res.send(svg);
  });
}

app.get('/*', function (req, res) {
  var latex = req.url.substr(1);
  if (latex[0] == '?') latex = latex.substr(1);
  handleRenderRequest(decodeURIComponent(latex), req, res);
});

app.listen(8080, '0.0.0.0');
