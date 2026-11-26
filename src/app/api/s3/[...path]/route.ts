import {getErrorMessage} from "@/utils/getErrorMessage";
import s3 from "@/utils/s3Client";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {NextRequest, NextResponse} from "next/server";

export async function GET(_request: NextRequest, {params}: {params: Promise<{path: string[]}>}) {
	const { path } = await params;

	if (!path || path.length === 0) {
		return new Response("Not Found", {status: 404});
	}

	const key = path.join("/");

	try {
		const response = await s3.send(
			new GetObjectCommand({
				Bucket: process.env.R2_BUCKET_NAME!,
				Key: key,
			}),
		);

		return new Response(response.Body as ReadableStream, {
			headers: {
				"Content-Type": response.ContentType || "application/octet-stream",
				"Cache-Control": "public, max-age=31536000",
			},
		});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
