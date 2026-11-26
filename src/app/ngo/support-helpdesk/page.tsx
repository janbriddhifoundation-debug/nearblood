import SupportCenter from "@/components/Support/SupportCenter";

const Page = () => {
	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Support & helpdesk</div>
			<div className="text-sm text-gray-600 mb-8">Raise a ticket with the NearBlood team about verification, requests, donors, certificates or anything that isn&apos;t working.</div>
			<SupportCenter mode="user" />
		</div>
	);
};

export default Page;
