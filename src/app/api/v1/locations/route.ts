import {getActiveUser} from "@/services/userService";
import {NextRequest, NextResponse} from "next/server";
import {getErrorMessage} from "@/utils/getErrorMessage";
import axios from "axios";

interface LocationIQItem {
	display_name: string;
	lat: number;
	lon: number;
}

export async function GET(request: NextRequest) {
	try {
		const {error, response} = await getActiveUser();
		if (error) return response;

		const query = request.nextUrl.searchParams.get("query");
		if (!query) {
			return NextResponse.json({error: "Query parameter is required"}, {status: 400});
		}

		const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY;
		const url = `https://api.locationiq.com/v1/autocomplete`;
		const {data} = await axios.get(url, {
			params: {
				key: apiKey,
				q: query,
				limit: 5,
				countrycodes: "in",
			},
		});

		if (!Array.isArray(data)) {
			console.warn("Unexpected response format:", data);
			return NextResponse.json({error: "Unexpected response format"}, {status: 502});
		}
		const seen = new Set<string>();

		console.log(data[0]);

		const formatted = data
			.filter((item: LocationIQItem) => {
				if (seen.has(item.display_name)) return false;
				seen.add(item.display_name);
				return true;
			})
			.map((item: LocationIQItem, i: number) => ({
				key: i,
				label: item.display_name,
				value: item.display_name,
				lat: item.lat,
				lon: item.lon,
			}));

		return NextResponse.json({success: true, locations: formatted}, {status: 200});
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		return NextResponse.json({error: errorMessage}, {status: 500});
	}
}
