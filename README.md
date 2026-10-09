# Image Describer

A small React + Vite web app that uploads an image, describes it with OpenAI Vision, and can optionally save the result to Flickr.

## Setup

1. Copy `.env.example` to `.env`.
2. Add all required environment variables in `.env`:

```text
OPENAI_API_KEY=your_openai_api_key_here
FLICKR_API_KEY=your_flickr_api_key_here
FLICKR_API_SECRET=your_flickr_api_secret_here

# Optional
PORT=5175
DEBUG=false
```

Required values:
- `OPENAI_API_KEY`: your OpenAI API key used for image description requests.
- `FLICKR_API_KEY`: your Flickr API key used for OAuth authentication.
- `FLICKR_API_SECRET`: your Flickr API secret used for OAuth signing.

Optional values:
- `PORT`: the local port for the Node server. Defaults to `5175`.
- `DEBUG`: set to `true` or `1` to enable extra debug logging.

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

## Notes

- The backend proxy keeps the API keys server-side instead of exposing them in the client.
- The image description flow uses OpenAI Vision via the OpenAI SDK.
- Flickr saving requires a valid Flickr OAuth app configuration with both `FLICKR_API_KEY` and `FLICKR_API_SECRET` set.

## Troubleshooting

If the server fails to start, check that the required environment variables are present in `.env` and restart the app.

Common issues:
- `OPENAI_API_KEY is not configured.`
- `FLICKR_API_KEY and FLICKR_API_SECRET must be set in environment.`

You can also run the server directly for debugging with:

```bash
node --env-file=.env server/server.js
```
