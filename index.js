var http = require('http');

function createServer(port) {
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

  var server = http.createServer(function (request, response) {
    request.on('data', function (chunk) {});
    request.on('end', function () {
      var math = decodeURIComponent(request.url.substr(1));
      if (!math) {
        var example = encodeURIComponent('x = \\sum\\limits_{i=1}^n');
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<h1>TeX.La (LaTeX)</h1>\n');
        response.write('<p>Usage:<br>\n');
        response.write('<code>&lt;img height="50" src=&quot;http://tex.la/' + example + '&quot;&gt;</code></p>\n');
        response.write('<p><img height="50" src="/' + example + '"></p>');
        response.end();
        return;
      }
      mathjax.typeset({math: math, svg: true}, function (result) {
        if (!result.errors) {
          response.writeHead(200, {'Content-Type': 'image/svg+xml'});
          response.end(result.svg);
        } else {
          response.writeHead(400, {'Content-Type': 'text/plain'});
          response.write('Error 400: Request Failed.\n');
          response.write(String(result.errors) + '\n');
          response.write(str_params + '\n');
          response.end();
        }
      });
    });
  });
  server.listen(port, function () {
    console.log('Server listening on port %s' , port);
  });
  return server;
}

var server = createServer(8000);
