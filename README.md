# Image Describer

A small React + Vite web app that uploads an image, describes it with OpenAI Vision, and can optionally save the result to Flickr.

## Setup

1. Copy `.env.example` to `.env`.
2. Add all required environment variables in `.env`:

```text
OPENAI_API_KEY=your_openai_api_key_here
FLICKR_API_KEY=your_flickr_api_key_here
FLICKR_API_SECRET=your_flickr_api_secret_here

# Instagram publishing (required for live Instagram posts)
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:5175/auth/instagram/callback
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# Optional
PORT=5175
DEBUG=false
```

Required values:
- `OPENAI_API_KEY`: your OpenAI API key used for image description requests.
- `FLICKR_API_KEY`: your Flickr API key used for OAuth authentication.
- `FLICKR_API_SECRET`: your Flickr API secret used for OAuth signing.
- `INSTAGRAM_APP_ID`: your Instagram/Facebook app ID used for OAuth.
- `INSTAGRAM_APP_SECRET`: your Instagram/Facebook app secret used for token exchange.
- `INSTAGRAM_ACCESS_TOKEN`: a valid Instagram Graph access token for the connected business account.
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`: the Instagram business account ID that will receive the post.

Optional values:
- `PORT`: the local port for the Node server. Defaults to `5175`.
- `DEBUG`: set to `true` or `1` to enable extra debug logging.
- `INSTAGRAM_REDIRECT_URI`: defaults to `http://localhost:5175/auth/instagram/callback` when omitted.

3. Install dependencies:

```bash
npm install
```

4. Start the app in development mode:

```bash
npm run dev
```

This starts both the Vite client and the Node server together, and the server loads the variables from `.env` automatically via the `node --env-file=.env` script in `package.json`.

## Usage

- Open the app in your browser.
- Choose an image file.
- Click `Describe this image`.
- The app sends the image to the backend and displays the returned description and tags.
- If you want to save the generated description to Flickr, connect your Flickr account from the app UI.
- If you want to publish to Instagram, configure the Instagram environment variables and choose the Instagram publishing option.

## Notes

- The backend proxy keeps the API keys server-side instead of exposing them in the client.
- The image description flow uses OpenAI Vision via the OpenAI SDK.
- Flickr saving requires a valid Flickr OAuth app configuration with both `FLICKR_API_KEY` and `FLICKR_API_SECRET` set.
- Real Instagram publishing requires valid Instagram Graph API credentials and a public image or public URL that Instagram accepts for media creation. This is a live platform integration, not a static mock.

## Troubleshooting

If the server fails to start, check that the required environment variables are present in `.env` and restart the app.

Common issues:
- `OPENAI_API_KEY is not configured.`
- `FLICKR_API_KEY and FLICKR_API_SECRET must be set in environment.`

You can also run the server directly for debugging with:

```bash
node --env-file=.env server/server.js
```
