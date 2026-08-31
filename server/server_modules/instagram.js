import crypto from "node:crypto";
import sharp from "sharp";
import { debug, error } from "../logger.js";

const instagramSessions = new Map();

export function buildInstagramAuthUrl(appId, redirectUri, sid = "") {
  if (!appId || !redirectUri) {
    throw new Error("INSTAGRAM_APP_ID and INSTAGRAM_REDIRECT_URI must be configured.");
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "instagram_basic,pages_show_list,pages_manage_metadata,instagram_content_publish",
    response_type: "code",
  });

  if (sid) {
    params.set("state", sid);
  }

  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}

export async function prepareInstagramImage(imageDataUrl, format = "portrait") {
  if (!imageDataUrl) {
    throw new Error("image is required");
  }

  const matches = String(imageDataUrl).match(/^data:(.*?);base64,(.*)$/);
  if (!matches) {
    throw new Error("Invalid data URL for image.");
  }

  const buffer = Buffer.from(matches[2], "base64");

  const target = {
    portrait: { width: 1080, height: 1350, fit: "cover" },
    square: { width: 1080, height: 1080, fit: "cover" },
    landscape: { width: 1350, height: 1080, fit: "cover" },
  }[format] ?? { width: 1080, height: 1350, fit: "cover" };

  const transformed = await sharp(buffer)
    .rotate()
    .resize(target.width, target.height, { fit: target.fit, position: "centre" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return {
    image: `data:image/jpeg;base64,${transformed.toString("base64")}`,
    width: target.width,
    height: target.height,
    format,
  };
}

export function buildInstagramCaption(description, tags = []) {
  const safeDescription = String(description || "").trim();
  const tagList = Array.isArray(tags) ? tags.filter(Boolean).slice(0, 10) : [];
  const hashtags = tagList.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ");

  const caption = safeDescription ? `${safeDescription}\n\n${hashtags}`.trim() : hashtags.trim();
  return caption || "Fresh upload from Image Describer";
}

export function getInstagramAuthStatus(sid) {
  const session = instagramSessions.get(sid || "");
  return { authenticated: Boolean(session?.accessToken) };
}

export async function handleInstagramAuthStart(req, res, PORT, IS_DEBUG_MODE) {
  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `http://localhost:${PORT}/auth/instagram/callback`;

    if (!appId) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "INSTAGRAM_APP_ID must be set in environment." }));
      return;
    }

    const sid = crypto.randomBytes(12).toString("hex");
    const authUrl = buildInstagramAuthUrl(appId, redirectUri, sid);
    instagramSessions.set(sid, { redirectUri, createdAt: Date.now() });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ authUrl, sid }));
  } catch (err) {
    error("Instagram auth start failed:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Failed to start Instagram auth." }));
  }
}

export async function handleInstagramAuthCallback(req, res, PORT, IS_DEBUG_MODE) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get("code") || "";
    const sid = url.searchParams.get("state") || url.searchParams.get("sid") || "";

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Instagram auth code missing.");
      return;
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `http://localhost:${PORT}/auth/instagram/callback`;

    if (!appId || !appSecret) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be set in environment.");
      return;
    }

    const tokenUrl = "https://graph.facebook.com/v20.0/oauth/access_token";
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResp = await fetch(`${tokenUrl}?${params.toString()}`);
    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || !tokenData.access_token) {
      throw new Error(tokenData?.error?.message || "Failed to exchange Instagram auth code.");
    }

    const session = instagramSessions.get(sid) || {};
    instagramSessions.set(sid, { ...session, accessToken: tokenData.access_token, expiresIn: tokenData.expires_in });

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body><p>Instagram authentication complete.</p><p>You can close this window and return to the app.</p></body></html>");
  } catch (err) {
    error("Instagram callback failed:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Instagram auth callback failed.");
  }
}

export async function handleInstagramPublish(req, res, IS_DEBUG_MODE) {
  try {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    await new Promise((resolve) => req.on("end", resolve));

    const payload = JSON.parse(body || "{}");
    const { image, imageUrl, description, tags, format = "portrait" } = payload;

    if (IS_DEBUG_MODE) {
      debug("Instagram publish payload:", payload);
    }

    if (!image && !imageUrl) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "image or imageUrl is required" }));
      return;
    }

    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Instagram API is not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in the environment.",
        })
      );
      return;
    }

    const prepared = await prepareInstagramImage(image || imageUrl, format);
    const caption = buildInstagramCaption(description, tags);
    const finalImageUrl = imageUrl || prepared.image;

    const createResp = await fetch(`https://graph.facebook.com/v20.0/${businessAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        image_url: finalImageUrl,
        caption,
        media_type: "IMAGE",
      }),
    });

    const createData = await createResp.json();
    if (!createResp.ok || !createData.id) {
      throw new Error(createData?.error?.message || "Instagram media creation failed.");
    }

    const publishResp = await fetch(`https://graph.facebook.com/v20.0/${createData.id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const publishData = await publishResp.json();
    if (!publishResp.ok || !publishData.id) {
      throw new Error(publishData?.error?.message || "Instagram publish failed.");
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        published: true,
        image: prepared.image,
        caption,
        width: prepared.width,
        height: prepared.height,
        format: prepared.format,
        mediaId: createData.id,
        instagramPostId: publishData.id,
      })
    );
  } catch (err) {
    error("Instagram publish failed:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Failed to publish to Instagram." }));
  }
}
