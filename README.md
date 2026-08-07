# Image Describer

A small React + Vite web app that uploads an image and returns a detailed description using OpenAI Vision.

## Setup

1. Copy `.env.example` to `.env`.
2. Set your OpenAI API key in `.env`:

```text
OPENAI_API_KEY=your_openai_api_key_here
```

3. Install dependencies:

```bash
npm install
```

4. Start the app (dev):

Use the following two terminals for development. First, set your OpenAI API key in the environment (or copy `.env.example` to `.env`):

```powershell
$env:OPENAI_API_KEY="your_openai_api_key_here"
npm run dev:client
```

In a second terminal start the plain Node server (no npm dependencies required for the server shim):

```powershell
node server/server.js
```

## Usage

- Open the app in your browser.
- Choose an image file.
- Click `Describe this image`.
- The app sends the image to the backend proxy and displays the returned description and tags.

## Notes

- The backend proxy is required so the OpenAI API key stays server-side.
- The app currently uses OpenAI Vision via the OpenAI SDK.
