import SupportCenter from "@/components/Support/SupportCenter";

const Page = () => {
	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Help & support</div>
			<div className="text-sm text-gray-600 mb-8">Questions about your donations, certificates or your NGO? Raise a ticket and the NearBlood team will reply here.</div>
			<SupportCenter mode="user" />
		</div>
	);
};

export default Page;
