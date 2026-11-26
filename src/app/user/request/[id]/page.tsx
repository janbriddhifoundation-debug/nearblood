import React from "react";
import UserRequestDetailsView from "@/views/UserRequestDetailsView";

const RequestDetailsPage = async ({params}: {params: Promise<{id: string}>}) => {
	const {id} = await params;
	return (
		<div className="p-4 lg:p-8 max-w-[1320px] mx-auto">
			<UserRequestDetailsView id={id} />
		</div>
	);
};

export default RequestDetailsPage;
