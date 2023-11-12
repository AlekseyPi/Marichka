const http = require("http");
const fs = require("fs");
const path = require("path");

http
  .createServer((req, res) => {
    let filePath = path.join(__dirname, req.url);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, "../dist", req.url);
    }

    const extname = String(path.extname(req.url)).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
    };

    const contentType = mimeTypes[extname] || "application/octet-stream";

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(`Error reading file: ${err.message}`);
          res.writeHead(500);
          res.end(JSON.stringify(err));
          return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
        console.log(`GET ${req.url}`);
      });
    } else {
      console.warn(`File not found: ${filePath}`);
      res.writeHead(404);
      res.end("File not found.");
    }
  })
  .listen(3001, () => {
    console.log("Server started on http://localhost:3001");
    console.log("http://localhost:3001/silence-detector-processor.js");
    console.log("http://localhost:3001/speech-to-text.html");
  });
