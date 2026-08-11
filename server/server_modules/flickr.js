import crypto from "node:crypto";
import { URLSearchParams } from "node:url";
import { debug, error } from "../logger.js";

const sessions = new Map();

export async function createFlickrAuthSession(PORT, IS_DEBUG_MODE) {
  const FLICKR_KEY = process.env.FLICKR_API_KEY;
  const FLICKR_SECRET = process.env.FLICKR_API_SECRET;
  if (!FLICKR_KEY || !FLICKR_SECRET) {
    throw new Error("FLICKR_API_KEY and FLICKR_API_SECRET must be set in environment.");
  }

  const sid = crypto.randomBytes(12).toString("hex");
  const callbackUrl = `http://localhost:${PORT}/auth/flickr/callback?sid=${sid}`;

  const oauthParams = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: FLICKR_KEY,
    oauth_nonce: generateNonce(8),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  if (IS_DEBUG_MODE) {
    debug("Flickr OAuth Start Params:", oauthParams);
  }

  const requestTokenUrl = "https://www.flickr.com/services/oauth/request_token";
  const signature = buildOAuthSignature("POST", requestTokenUrl, oauthParams, FLICKR_SECRET);
  oauthParams.oauth_signature = signature;

  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  if (IS_DEBUG_MODE) {
    debug("Flickr OAuth Start Auth Header:", authHeader);
  }

  const resp = await fetch(requestTokenUrl, { method: "POST", headers: { Authorization: authHeader } });

  if (IS_DEBUG_MODE) {
    debug("Flickr OAuth Start Response Status:", resp.status);
    debug("Flickr OAuth Start Response Headers:", [...resp.headers.entries()]);
  }

  const text = await resp.text();

  if (IS_DEBUG_MODE) {
    debug("Flickr OAuth Start Response Text:", text);
  }

  const parsed = Object.fromEntries(new URLSearchParams(text));
  const { oauth_token: oauthToken, oauth_token_secret: oauthTokenSecret } = parsed;
  if (!oauthToken) {
    throw new Error("Failed to obtain request token from Flickr.");
  }

  sessions.set(sid, { requestTokenSecret: oauthTokenSecret });
  const authorizeUrl = `https://www.flickr.com/services/oauth/authorize?oauth_token=${oauthToken}&perms=write`;

  if (IS_DEBUG_MODE) {
    debug("Flickr OAuth Start Redirecting to:", authorizeUrl);
  }

  return { authorizeUrl, sid };
}

export function getFlickrAuthStatus(sid) {
  const session = sessions.get(sid);
  return { authenticated: Boolean(session?.accessToken && session?.accessTokenSecret) };
}

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateNonce(length = 24) {
  return crypto.randomBytes(length).toString("hex");
}

function hmacSha1(key, baseString) {
  return crypto.createHmac("sha1", key).update(baseString).digest("base64");
}

function buildOAuthSignature(method, baseUrl, params, consumerSecret, tokenSecret = "") {
  const encodedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(baseUrl), percentEncode(encodedParams)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return hmacSha1(signingKey, baseString);
}

export async function handleStart(req, res, PORT, IS_DEBUG_MODE) {
  const FLICKR_KEY = process.env.FLICKR_API_KEY;
  const FLICKR_SECRET = process.env.FLICKR_API_SECRET;
  if (!FLICKR_KEY || !FLICKR_SECRET) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("FLICKR_API_KEY and FLICKR_API_SECRET must be set in environment.");
    return;
  }

  try {
    const sid = crypto.randomBytes(12).toString("hex");
    const callbackUrl = `http://localhost:${PORT}/auth/flickr/callback?sid=${sid}`;

    const oauthParams = {
      oauth_callback: callbackUrl,
      oauth_consumer_key: FLICKR_KEY,
      oauth_nonce: generateNonce(8),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: "1.0",
    };

    if(IS_DEBUG_MODE) {
      debug("Flickr OAuth Start Params:", oauthParams);
    }

    const requestTokenUrl = "https://www.flickr.com/services/oauth/request_token";
    const signature = buildOAuthSignature("POST", requestTokenUrl, oauthParams, FLICKR_SECRET);
    oauthParams.oauth_signature = signature;

    const authHeader =
      "OAuth " +
      Object.keys(oauthParams)
        .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
        .join(", ");


    if(IS_DEBUG_MODE) {
      debug("Flickr OAuth Start Auth Header:", authHeader);
    }

    const resp = await fetch(requestTokenUrl, { method: "POST", headers: { Authorization: authHeader } });
    
    if(IS_DEBUG_MODE) {
      debug("Flickr OAuth Start Response Status:", resp.status);
      debug("Flickr OAuth Start Response Headers:", [...resp.headers.entries()]);
    }

    const text = await resp.text();

    if(IS_DEBUG_MODE) {
      debug("Flickr OAuth Start Response Text:", text);
    }

    const parsed = Object.fromEntries(new URLSearchParams(text));

    const { oauth_token: oauthToken, oauth_token_secret: oauthTokenSecret } = parsed;
    if (!oauthToken) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Failed to obtain request token from Flickr.");
      return;
    }

    sessions.set(sid, { requestTokenSecret: oauthTokenSecret });

    const authorizeUrl = `https://www.flickr.com/services/oauth/authorize?oauth_token=${oauthToken}&perms=write`;

    if(IS_DEBUG_MODE) {
      debug("Flickr OAuth Start Redirecting to:", authorizeUrl);
    }

    res.writeHead(302, { Location: authorizeUrl });
    res.end();
  } catch (err) {
    error("Flickr start failed:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Failed to start Flickr auth.");
  }
}

export async function handleCallback(req, res, PORT, IS_DEBUG_MODE) {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const oauthToken = url.searchParams.get("oauth_token") || "";
    const oauthVerifier = url.searchParams.get("oauth_verifier") || "";
    const sid = url.searchParams.get("sid") || "";

    const session = sessions.get(sid) || {};
    const requestTokenSecret = session.requestTokenSecret || "";

    const FLICKR_KEY = process.env.FLICKR_API_KEY;
    const FLICKR_SECRET = process.env.FLICKR_API_SECRET;

    const accessUrl = "https://www.flickr.com/services/oauth/access_token";
    const oauthParams = {
      oauth_consumer_key: FLICKR_KEY,
      oauth_nonce: generateNonce(8),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauthToken,
      oauth_verifier: oauthVerifier,
      oauth_version: "1.0",
    };

    const signature = buildOAuthSignature("POST", accessUrl, oauthParams, FLICKR_SECRET, requestTokenSecret);
    oauthParams.oauth_signature = signature;

    const authHeader =
      "OAuth " +
      Object.keys(oauthParams)
        .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
        .join(", ");

    const resp = await fetch(accessUrl, { method: "POST", headers: { Authorization: authHeader } });
    const text = await resp.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));

    const accessToken = parsed.oauth_token;
    const accessTokenSecret = parsed.oauth_token_secret;

    sessions.set(sid, { accessToken, accessTokenSecret });

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<html><body><p>Flickr authentication complete.</p><p>You can close this window and return to the app.</p></body></html>`);
  } catch (err) {
    error("Flickr callback failed:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Flickr auth callback failed.");
  }
}

export async function handleSave(req, res, IS_DEBUG_MODE) {
  try {
    const FLICKR_KEY = process.env.FLICKR_API_KEY;
    const FLICKR_SECRET = process.env.FLICKR_API_SECRET;
    if (!FLICKR_KEY || !FLICKR_SECRET) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "FLICKR_API_KEY and FLICKR_API_SECRET not configured." }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    await new Promise((r) => req.on("end", r));

    const payload = JSON.parse(body || "{}");
    const { image, description, tags, visibility, sid } = payload;

    if(IS_DEBUG_MODE) {
      debug("Save to Flickr Payload:", payload);
    }

    if (!image) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "image is required" }));
      return;
    }

    const session = sessions.get(sid || "") || {};
    const accessToken = session.accessToken;
    const accessTokenSecret = session.accessTokenSecret;
    if (!accessToken || !accessTokenSecret) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not authenticated with Flickr for this session." }));
      return;
    }

    const uploadUrl = "https://up.flickr.com/services/upload/";
    const tagsString = Array.isArray(tags) ? tags.join(" ") : String(tags || "");
    const title = payload.title || "Image from Image Describer";
    const is_public = visibility === "public" ? "1" : "0";

    const oauthParams = {
      oauth_consumer_key: FLICKR_KEY,
      oauth_nonce: generateNonce(8),
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    const paramsForSign = {
      api_key: FLICKR_KEY,
      title,
      description: description || "",
      tags: tagsString,
      is_public,
      ...oauthParams,
    };

    const signature = buildOAuthSignature("POST", uploadUrl, paramsForSign, FLICKR_SECRET, accessTokenSecret);
    oauthParams.oauth_signature = signature;

    const authHeader =
      "OAuth " + [
        `oauth_consumer_key="${percentEncode(oauthParams.oauth_consumer_key)}"`,
        `oauth_token="${percentEncode(oauthParams.oauth_token)}"`,
        `oauth_signature_method="HMAC-SHA1"`,
        `oauth_timestamp="${oauthParams.oauth_timestamp}"`,
        `oauth_nonce="${oauthParams.oauth_nonce}"`,
        `oauth_version="1.0"`,
        `oauth_signature="${percentEncode(oauthParams.oauth_signature)}"`,
      ].join(", ");

    const boundary = "----nodeflickr" + crypto.randomBytes(8).toString("hex");
    const parts = [];
    function appendField(name, value) {
      parts.push(Buffer.from(`--${boundary}\r\n`));
      parts.push(Buffer.from(`Content-Disposition: form-data; name="${name}"\r\n\r\n`));
      parts.push(Buffer.from(String(value)));
      parts.push(Buffer.from("\r\n"));
    }

    appendField("api_key", FLICKR_KEY);
    appendField("title", title);
    appendField("description", description || "");
    appendField("tags", tagsString);
    appendField("is_public", is_public);

    const matches = String(image).match(/^data:(.*?);base64,(.*)$/);
    if (!matches) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid data URL for image." }));
      return;
    }
    const mime = matches[1];
    const b64 = matches[2];
    const photoBuffer = Buffer.from(b64, "base64");

    parts.push(Buffer.from(`--${boundary}\r\n`));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="photo"; filename="upload"\r\n`));
    parts.push(Buffer.from(`Content-Type: ${mime}\r\n\r\n`));
    parts.push(photoBuffer);
    parts.push(Buffer.from("\r\n"));

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const bodyBuffer = Buffer.concat(parts);

    const resp = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(bodyBuffer.length),
      },
      body: bodyBuffer,
    });

    const text = await resp.text();

    if (IS_DEBUG_MODE) {
      debug("Flickr upload response status:", resp.status);
      debug("Flickr upload response text:", text);
    }

    const uploadErrorMatch = text.match(/<err[^>]*code="([^"]+)"[^>]*msg="([^"]+)"/i);
    if (!resp.ok || uploadErrorMatch) {
      const message = uploadErrorMatch ? uploadErrorMatch[2] : `Flickr upload failed with status ${resp.status}`;
      res.writeHead(resp.ok ? 500 : resp.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
      return;
    }

    const photoIdMatch = text.match(/<photoid[^>]*>([^<]+)<\/photoid>/i);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, photoId: photoIdMatch ? photoIdMatch[1] : null }));
  } catch (err) {
    error("Save to Flickr failed:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to save to Flickr." }));
  }
}
