import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { error, log } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const upload = multer({ dest: path.resolve(__dirname, "../.tmp") });
const port = process.env.PORT ? Number(process.env.PORT) : 5175;

if (!process.env.OPENAI_API_KEY) {
  error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());

app.post("/api/describe", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required." });
  }

  try {
    const imagePath = req.file.path;
    const imageData = await fs.readFile(imagePath);
    const imageB64 = imageData.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${imageB64}`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Describe this image in detail." },
            { type: "input_image", image_url: imageUrl }
          ]
        }
      ]
    });

    await fs.unlink(imagePath);

    const description = response.output?.[0]?.content?.find((item: any) => item.type === "output_text")?.text || "No description returned.";
    res.json({ description });
  } catch (err) {
    error("Describe request failed:", err);
    res.status(500).json({ error: "Failed to describe image." });
  }
});

app.listen(port, () => {
  log(`Server listening on http://localhost:${port}`);
});
