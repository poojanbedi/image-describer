import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareInstagramImage, buildInstagramCaption, buildInstagramAuthUrl } from "./instagram.js";

test("prepareInstagramImage creates a 4:5 Instagram-ready image", async () => {
  const buffer = await sharp({
    create: {
      width: 1200,
      height: 1600,
      channels: 3,
      background: { r: 255, g: 128, b: 0 },
    },
  })
    .png()
    .toBuffer();

  const sampleImage = `data:image/png;base64,${buffer.toString("base64")}`;
  const result = await prepareInstagramImage(sampleImage, "portrait");

  assert.equal(result.format, "portrait");
  assert.equal(result.width, 1080);
  assert.equal(result.height, 1350);
  assert.match(result.image, /^data:image\/jpeg;base64,/);
});

test("buildInstagramCaption adds hashtags from the tags list", () => {
  const caption = buildInstagramCaption("Test description", ["travel", "sunset"]);
  assert.match(caption, /Test description/);
  assert.match(caption, /#travel/);
  assert.match(caption, /#sunset/);
});

test("buildInstagramAuthUrl includes a state for the OAuth session", () => {
  const url = buildInstagramAuthUrl("app123", "http://localhost:5175/auth/instagram/callback", "session-abc");
  assert.match(url, /state=session-abc/);
  assert.match(url, /client_id=app123/);
});
