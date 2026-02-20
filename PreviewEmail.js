var http = require("http");
var fs = require("fs");
var file = fs.readFileSync("Text-HTML.txt", "utf8");
http.createServer(function (req, res) {
 res.write(file);
}).listen(8080);

/*http.createServer(function (req, res) {
 fs.readFile("Text-HTML.txt", function (err, data) {
  res.write(data);
 });
 fs.readFile("Text-HTML.txt", function (err, data) {
  res.write(data);
  return res.end();
 });
}).listen(8080);
*/