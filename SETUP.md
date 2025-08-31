# Room Stager Setup Instructions

This is a Next.js application that uses fal.ai and Google's nano-banana model to transform room photos with AI-powered staging.

## Setup Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your fal.ai API key:
   ```
   FAL_KEY=your_fal_api_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

3. **Get your fal.ai API key:**
   - Go to https://fal.ai/dashboard
   - Create an account if you don't have one
   - Generate an API key
   - Add it to your `.env.local` file

4. **Add example room pictures:**
   - Place your example room staging pictures in `public/example-rooms/`
   - Supported formats: JPG, JPEG, PNG
   - These images will be used as style references for the AI model

5. **Start the development server:**
   ```bash
   pnpm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## How it Works

1. User uploads a room photo on the landing page
2. The photo is processed along with example room images from `public/example-rooms/`
3. The nano-banana model transforms the uploaded room using the style of the example rooms
4. User sees the staged room result and can download it

## API Key Requirements

You'll need a fal.ai API key to use this application. The nano-banana model costs approximately $0.039 per image generated.

## File Structure

- `src/app/page.tsx` - Landing page with upload functionality
- `src/app/api/stage-room/route.ts` - API endpoint for processing images
- `src/app/result/page.tsx` - Results display page
- `public/example-rooms/` - Directory for example room staging images