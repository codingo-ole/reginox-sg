// Vercel entrypoint. The Express app is shared with the standalone server —
// backend/server.js only calls app.listen() when it is run directly, so
// importing it here hands Vercel a plain request handler.
module.exports = require("../backend/server.js");
