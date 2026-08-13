const express = require("express");
const app = express();

// VERSION and COLOR are baked in at build time or set via env.
// Changing them and redeploying makes the GitOps sync visible in the browser.
const VERSION = process.env.APP_VERSION || "0.0.0";
const COLOR = process.env.APP_COLOR || "#2563eb";
const PORT = process.env.PORT || 3000;

let ready = false;
// Simulate a short startup so readiness vs liveness is demonstrable.
const startupTimer = setTimeout(() => { ready = true; }, 3000);
startupTimer.unref(); // don't keep the process alive during tests

app.get("/", (req, res) => {
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Demo App</title>
<style>
  body{font-family:system-ui;margin:0;height:100vh;display:flex;
       align-items:center;justify-content:center;background:${COLOR};color:#fff}
  .card{text-align:center}
  h1{font-size:4rem;margin:0}
  p{opacity:.85;font-size:1.25rem}
</style></head>
<body><div class="card">
  <h1>v${VERSION}</h1>
  <p>Served from pod: ${process.env.HOSTNAME || "local"}</p>
</div></body></html>`);
});

// Liveness: is the process alive at all?
app.get("/healthz", (req, res) => res.status(200).json({ status: "alive" }));

// Readiness: is it ready to receive traffic yet?
app.get('/readyz', (req, res) => {
  res.status(500).json({ status: 'broken' });
});

// A simple JSON endpoint for pipeline smoke tests.
app.get("/api/version", (req, res) => res.json({ version: VERSION }));

// Only start listening when run directly (node app/server.js),
// not when imported by the test suite.
if (require.main === module) {
  app.listen(PORT, () => console.log(`demo-app v${VERSION} listening on ${PORT}`));
}

module.exports = app;
