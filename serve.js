/* Local preview only. Run: node serve.js  -> http://localhost:5174
   Emulates the .htaccess clean-URL rule so /about works in dev too. */
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = __dirname, PORT = process.env.PORT || 5174;
const TYPES = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".jpg":"image/jpeg",
  ".png":"image/png", ".webp":"image/webp", ".xml":"application/xml", ".txt":"text/plain; charset=utf-8" };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  let file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  fs.readFile(file, (err, data) => {
    if (err) {
      // Serve the real 404 page, the way ErrorDocument does in production
      fs.readFile(path.join(ROOT, "404.html"), (e2, body) => {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end(e2 ? "<h1>404</h1>" : body);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Aarika running at http://localhost:" + PORT));
