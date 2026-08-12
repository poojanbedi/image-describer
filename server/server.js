#!/usr/bin/env node
import { createServer } from "node:http";
import { env } from "node:process";
import { log } from "./logger.js";
import { handleDescribe } from "./server_modules/openai.js";
import { handleStart, handleCallback, handleSave, createFlickrAuthSession, getFlickrAuthStatus } from "./server_modules/flickr.js";

const PORT = env.PORT ? Number(env.PORT) : 5175;
const OPENAI_KEY = env.OPENAI_API_KEY;
const IS_DEBUG_MODE = env.DEBUG === "true" || env.DEBUG === "1";

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/describe") {
    return handleDescribe(req, res, OPENAI_KEY, IS_DEBUG_MODE);
  }

  if (req.method === "GET" && req.url && req.url.startsWith("/api/flickr/start")) {
    try {
      const { authorizeUrl, sid } = await createFlickrAuthSession(PORT, IS_DEBUG_MODE);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ authorizeUrl, sid }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Failed to start Flickr auth." }));
    }
    return;
  }

  if (req.method === "GET" && req.url && req.url.startsWith("/api/flickr/status")) {
    const url = new URL(req.url, "http://localhost");
    const sid = url.searchParams.get("sid") || "";
    if (!sid) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "sid is required" }));
      return;
    }

    const status = getFlickrAuthStatus(sid);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
    return;
  }

  if (req.method === "GET" && req.url && req.url.startsWith("/auth/flickr/start")) {
    return handleStart(req, res, PORT, IS_DEBUG_MODE);
  }

  if (req.method === "GET" && req.url && req.url.startsWith("/auth/flickr/callback")) {
    return handleCallback(req, res, PORT, IS_DEBUG_MODE);
  }

  if (req.method === "POST" && req.url === "/api/save-to-flickr") {
    return handleSave(req, res, IS_DEBUG_MODE);
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  log(`Server listening on http://localhost:${PORT}`);
});
