#!/usr/bin/env node
import { createServer } from "node:http";
import { env } from "node:process";


const PORT = env.PORT ? Number(env.PORT) : 5175;
const OPENAI_KEY = env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set. The server will start, but image descriptions will fail until the key is provided.");
}

const server = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/describe") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const image = payload.image;
        if (!image) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "image is required" }));
          return;
        }

        if (!OPENAI_KEY) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }));
          return;
        }

        const resp = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: "Describe this image in detail." },
                  { type: "input_image", image_url: image },
                ],
              },
            ],
          }),
        });

        const data = await resp.json();

        const description =
          data.output?.[0]?.content?.find((item) => item.type === "output_text")?.text ||
          (data.output?.[0]?.content?.map((c) => c.text || "").join("\n") || "No description returned.");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ description }));
      } catch (err) {
        console.error("Describe request failed:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to describe image." }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
