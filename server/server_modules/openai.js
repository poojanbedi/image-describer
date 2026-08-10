import { URL } from "node:url";
import { debug, error } from "../logger.js";

export async function handleDescribe(req, res, OPENAI_KEY, IS_DEBUG_MODE) {
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
                {
                  type: "input_text",
                  text: "Describe this image in detail. Then output only a JSON object with keys description and tags. Tags should be a short array of lowercase labels describing the scene. Do not include any explanation outside the JSON object.",
                },
                { type: "input_image", image_url: image },
              ],
            },
          ],
        }),
      });

      const data = await resp.json();

      if (IS_DEBUG_MODE) debug("OpenAI response:", JSON.stringify(data, null, 2));

      const textOutput =
        data.output?.[0]?.content?.filter((item) => item.type === "output_text")?.map((item) => item.text).join("\n") || "";

      let description = "No description returned.";
      let tags = [];

      try {
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          description = parsed.description ?? description;
          tags = Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).trim()) : [];
        } else {
          description = textOutput.trim() || description;
        }
      } catch (e) {
        description = textOutput.trim() || description;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ description, tags }));
    } catch (err) {
      error("Describe request failed:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to describe image." }));
    }
  });
}
