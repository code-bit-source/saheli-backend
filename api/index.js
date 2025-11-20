const serverless = require("serverless-http");
const app = require("../Server");   // <-- Tumhara Express App

module.exports = serverless(app);
