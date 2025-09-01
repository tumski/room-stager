export const runtime = "nodejs";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";

fal.config({
	credentials: process.env.FAL_KEY || "",
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const roomImage = formData.get("roomImage") as File | null;

		if (!roomImage || typeof roomImage.arrayBuffer !== "function") {
			return NextResponse.json(
				{ error: "No room image provided" },
				{ status: 400 },
			);
		}

		// Reject unsupported formats early (fal typically supports jpg, png, webp)
		const lowerName = roomImage.name?.toLowerCase?.() || "";
		const contentType = roomImage.type || "";
		const isHeic =
			lowerName.endsWith(".heic") ||
			lowerName.endsWith(".heif") ||
			/image\/heic|image\/heif/i.test(contentType);
		if (isHeic) {
			return NextResponse.json(
				{
					error:
						"Unsupported image format (HEIC/HEIF). Please upload JPG, PNG, or WEBP.",
				},
				{ status: 415 },
			);
		}

		// Upload the user-provided image directly to fal storage (no disk writes)
		const originalImageCdnUrl = await fal.storage.upload(roomImage);

		const exampleRoomsDir = path.join(process.cwd(), "public", "example-rooms");
		let exampleImageUrls: string[] = [];
		try {
			const exampleFiles = await fs.readdir(exampleRoomsDir);
				const imageFiles = exampleFiles.filter(
					(file) =>
						/\.(jpg|jpeg|png|webp)$/i.test(file) &&
						file.toLowerCase() !== "readme.md",
				);
                // Pick a stable, small subset (max 3) to match prompt
                imageFiles.sort();
                const selected = imageFiles.slice(0, 3);

			// Build URLs based on the current request origin
			const origin = request.nextUrl.origin;
			const isLocalhost = /localhost|127\.0\.0\.1/.test(origin);

			if (!isLocalhost) {
				// On production (e.g., Vercel), public assets are publicly accessible
				exampleImageUrls = selected.map(
					(file) => `${origin}/example-rooms/${file}`,
				);
			} else {
				// On localhost, fal servers can't fetch from your machine. Upload examples to fal storage.
				exampleImageUrls = await Promise.all(
					selected.map(async (file) => {
						const filePath = path.join(exampleRoomsDir, file);
						const buffer = await fs.readFile(filePath);
						const ext = path.extname(file).toLowerCase();
						const mime =
							ext === ".png"
								? "image/png"
								: ext === ".webp"
									? "image/webp"
									: "image/jpeg";
						// Convert Node Buffer to ArrayBuffer for Blob compatibility
						// Allocate a fresh ArrayBuffer (avoids SharedArrayBuffer typing issues)
						const ab = new ArrayBuffer(buffer.byteLength);
						new Uint8Array(ab).set(buffer);
						const blob = new Blob([ab], { type: mime });
						return fal.storage.upload(blob);
					}),
				);
			}
		} catch {
			exampleImageUrls = [];
		}

		let prompt =
			"Transform the uploaded photo of a cozy attic bedroom (with large slanted window, warm wood beams, brick elements, built-in shelving, and a mix of orange, cream, and natural wood tones). Preserve all architectural details and layout exactly as in the source image: keep the size, perspective, positions and shapes of windows and doors, placement of structural beams, and all built-in features intact." +
			" Restyle the room to precisely match the textures, color palette, and overall visual style of the three attached example images." +
			" Use the same design language and atmosphere: contemporary urban style, with a warm, inviting vibe, coordinated staging, playful decor touches, and a cohesive color story." +
			" Change the surface colors, wall/ceiling hues, flooring, furniture finishes, bedding, and decor accents so they reflect the exact style, materials, and mood of the sample images." +
			" Adapt staging and arrangement to feel as professionally finished as the references, applying cohesive styling and visual balance." +
			" Important:" +
			" Do not alter the layout, scale, or structure—window, door, and beam positions must remain unchanged." +
			" Only transform colors, textures, and decorative elements (such as throw blankets, rugs, artwork, and small objects) to match the exemplary style." +
			" Be true to the style and ambiance of the sample images: warm light, coordinated accent pops, and a modern yet lived-in, creative atmosphere." +
			" Style keywords for emphasis: Urban contemporary, warm color palette, natural textures, playful modern decor, casual and artistic staging, brick and wood accents.";

		if (exampleImageUrls.length > 0) {
			prompt +=
				" Use the style and staging approach shown in the example images to create a professionally staged room.";
		} else {
			prompt +=
				" Create a modern, clean, and professionally staged room with appropriate furniture, lighting, and decor that would appeal to potential buyers or renters.";
		}

		const result = (await fal.subscribe("fal-ai/nano-banana/edit", {
			input: {
				prompt,
				image_urls: [originalImageCdnUrl, ...exampleImageUrls],
				num_images: 1,
				output_format: "jpeg",
			},
			logs: false,
		})) as {
			images?: Array<{ url: string }>;
			data?: { images?: Array<{ url: string }>; description?: string };
			description?: string;
			requestId?: string;
		};

		const stagedUrl =
			result.images?.[0]?.url || result.data?.images?.[0]?.url || "";

		return NextResponse.json({
			success: true,
			originalImageUrl: originalImageCdnUrl,
			stagedImageUrl: stagedUrl,
			description:
				result.description ||
				result.data?.description ||
				"Room staged successfully",
		});
	} catch (error: unknown) {
		console.error("Error staging room:", error);
		// Try to surface fal validation errors if present without using any
		function hasStatus(e: unknown): e is { status: number } {
			return typeof e === "object" && e !== null && typeof (e as { status?: unknown }).status === "number";
		}
		function hasBody(e: unknown): e is { body: unknown } {
			return typeof e === "object" && e !== null && "body" in (e as object);
		}
		const status = hasStatus(error) ? error.status : 500;
		const details = hasBody(error)
			? error.body
			: error instanceof Error
				? error.message
				: "Unknown error";
		return NextResponse.json(
			{
				error: "Failed to stage room",
				details,
			},
			{ status },
		);
	}
}
