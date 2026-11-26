import {GetObjectCommand} from "@aws-sdk/client-s3";
import {NextRequest, NextResponse} from "next/server";
import s3 from "@/utils/s3Client";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {getActiveUser} from "@/services/userService";
import {canViewRestrictedFile, PUBLIC_FILE_FOLDERS, RESTRICTED_FILE_FOLDERS, SIGNED_IN_FILE_FOLDERS} from "@/services/fileAccessService";

// Streams an uploaded file from R2. Expects exactly /api/s3/<folder>/<filekey>.
// Event images are public, donor photos need a session, documents and proofs are limited to the people involved.
export async function GET(_request: NextRequest, {params}: {params: Promise<{path: string[]}>}) {
	const {path} = await params;

	if (!path || path.length !== 2 || path.some((segment) => !segment || segment.includes(".."))) {
		return NextResponse.json({error: "Not found"}, {status: 404});
	}

	const [folder, filekey] = path;
	const isPublic = PUBLIC_FILE_FOLDERS.includes(folder);

	if (!isPublic && !SIGNED_IN_FILE_FOLDERS.includes(folder) && !RESTRICTED_FILE_FOLDERS.includes(folder)) {
		return NextResponse.json({error: "Not found"}, {status: 404});
	}

	try {
		if (!isPublic) {
			const {error, response, user} = await getActiveUser();
			if (error) return response;

			if (RESTRICTED_FILE_FOLDERS.includes(folder) && !(await canViewRestrictedFile(user, folder, filekey))) {
				return NextResponse.json({error: "You don't have access to this file"}, {status: 403});
			}
		}

		const file = await s3.send(new GetObjectCommand({Bucket: process.env.R2_BUCKET_NAME!, Key: `${folder}/${filekey}`}));

		return new Response(file.Body as ReadableStream, {
			headers: {
				"Content-Type": file.ContentType || "application/octet-stream",
				// Private files must not sit in shared caches
				"Cache-Control": isPublic ? "public, max-age=31536000" : "private, max-age=3600",
			},
		});
	} catch (error) {
		return NextResponse.json({error: getErrorMessage(error)}, {status: 500});
	}
}
