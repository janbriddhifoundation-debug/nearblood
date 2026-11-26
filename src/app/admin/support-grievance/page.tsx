import SupportCenter from "@/components/Support/SupportCenter";

const Page = () => {
	return (
		<div className="p-4 md:p-8 max-w-[1320px] mx-auto">
			<div className="text-2xl font-semibold mb-2">Support & grievance</div>
			<div className="text-sm text-gray-600 mb-8">Tickets raised by NGOs, donors and requesters. Replies notify the person who raised the ticket.</div>
			<SupportCenter mode="admin" />
		</div>
	);
};

export default Page;
