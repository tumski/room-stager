## Room Stager (Next.js + fal.ai + nano-banana)

A minimal proof of concept to upload a room photo and get a staged version using fal.ai with Google’s nano-banana model. Images are uploaded ephemerally to fal storage (no local disk persistence) for Vercel compatibility.

### Prerequisites
- Node 18+ (or Vercel runtime)
- pnpm
- fal.ai API key

### Environment Variables
Create a `.env.local` for local dev (and add the same on Vercel):

```
FAL_KEY=your_fal_api_key
```

No other secrets are required. Example reference images are read from `public/example-rooms/`.

### Local Development
```bash
pnpm install
pnpm dev
```
Open `http://localhost:3000`.

Notes:
- On localhost, public files aren’t accessible to fal servers; the API uploads example images to fal storage automatically.
- On Vercel, public URLs are used directly.

### Deploy to Vercel
1. Push this repo to GitHub.
2. Import on Vercel.
3. Add `FAL_KEY` in Project Settings → Environment Variables.
4. Deploy.

### How it Works
- `POST /api/stage-room` accepts a multipart image, uploads to `fal.storage`, collects example images, and calls `fal-ai/nano-banana/edit`.
- The result page shows a before/after comparison using returned URLs.
