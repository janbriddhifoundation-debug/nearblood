import {NextRequest, NextResponse} from "next/server";
import {getActiveUser} from "@/services/userService";
import {getErrorMessage} from "@/utils/getErrorMessage";
import {prisma} from "../../../../../../prisma/prisma";
import {ngoRegSchema} from "@/validationSchema/NgoSchema";
import {createId} from "@paralleldrive/cuid2";

// Registration
export async function POST(req: NextRequest) {
	try {
		const {error, response, user} = await getActiveUser();
		if (error) return response;

		// Check if user is an NGO
		if (user?.role !== "ngo") {
			return NextResponse.json({error: "User is not an NGO"}, {status: 403});
		}

		// Check if user is already registered as an NGO
		const existingNgo = await prisma.organisation.findFirst({
			where: {
				userId: user.id,
			},
		});
		if (existingNgo) {
			return NextResponse.json({error: "User is already registered as an NGO"}, {status: 400});
		}

		const parsedData = await req.json();

		const validData = await ngoRegSchema.validate(parsedData, {abortEarly: false});

		const newNgo = await prisma.organisation.create({
			data: {
				name: validData?.name,
				type: validData?.type,
				regNo: validData?.regNo,
				estDate: validData?.estDate,
				address: validData?.address,
				website: validData?.website,
				regCertFilename: validData?.regCertFilename,
				userId: user.id,
			},
		});

		const regionData = validData?.regionCovered?.map((item) => {
			return {
				id: createId(),
				organisationId: newNgo?.id,
				locationName: item?.location,
				latitude: Number(item?.lat),
				longitude: Number(item?.lon),
			};
		});

		if (regionData?.length > 0) {
			try {
				await Promise.all([
					...regionData.map(
						(region) =>
							prisma.$executeRaw`
                            INSERT INTO "OrganisationRegion" (
                                "id",
                                "organisationId",
                                "locationName",
                                "latitude",
                                "longitude",
                                "location"
                            )
                            VALUES (
                                ${region.id},
                                ${region.organisationId},
                                ${region.locationName},
                                ${region.latitude},
                                ${region.longitude},
                                ST_SetSRID(ST_MakePoint(${region.longitude}, ${region.latitude}), 4326)
                            )
                        `,
					),
					prisma.organisationContact.create({
						data: {
							name: validData?.contactName,
							designation: validData?.designation,
							email: validData?.email,
							phone: validData?.phone,
							govtIdFilename: validData?.govtIdFilename,
							organisationId: newNgo?.id,
						},
					}),
				]);
			} catch (error) {
				await Promise.all([
					prisma.organisationRegion.deleteMany({
						where: {
							organisationId: newNgo.id,
						},
					}),
					prisma.organisationContact.deleteMany({
						where: {
							organisationId: newNgo.id,
						},
					}),
				]);

				await prisma.organisation.delete({
					where: {
						id: newNgo.id,
					},
				});
				throw error;
			}
		}

		return NextResponse.json({success: true}, {status: 201});
	} catch (error) {
		console.error("Error in NGO registration:", error);
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
