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

			// Build URLs based on the current request origin
			const origin = request.nextUrl.origin;
			const isLocalhost = /localhost|127\.0\.0\.1/.test(origin);

			if (!isLocalhost) {
				// On production (e.g., Vercel), public assets are publicly accessible
				exampleImageUrls = imageFiles.map(
					(file) => `${origin}/example-rooms/${file}`,
				);
			} else {
				// On localhost, fal servers can't fetch from your machine. Upload examples to fal storage.
				exampleImageUrls = await Promise.all(
					imageFiles.map(async (file) => {
						const filePath = path.join(exampleRoomsDir, file);
						const buffer = await fs.readFile(filePath);
						const ext = path.extname(file).toLowerCase();
						const mime =
							ext === ".png"
								? "image/png"
								: ext === ".webp"
									? "image/webp"
									: "image/jpeg";
						const uploadFile = new File([buffer], file, { type: mime });
						return fal.storage.upload(uploadFile);
					}),
				);
			}
		} catch (_) {
			exampleImageUrls = [];
		}

		let prompt =
			"Transform this room to be beautifully staged and furnished, similar in style to the example staged rooms provided.";

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
	} catch (error) {
		console.error("Error staging room:", error);
		return NextResponse.json(
			{
				error: "Failed to stage room",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
