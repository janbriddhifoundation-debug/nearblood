"use client";

import {Button, message} from "antd";
import {
	// FacebookOutlined,
	HeartOutlined,
	// LinkedinOutlined, SafetyCertificateOutlined, TwitterOutlined, UsergroupAddOutlined
} from "@ant-design/icons";
import AuthButtons from "@/components/AuthButtons";
import Image from "next/image";
import {useRouter} from "next/navigation";

export default function Home() {
	const router = useRouter();
	return (
		<>
			<div className="bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
				<div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
					<div className="layout-container flex h-full grow flex-col">
						{/* Header */}
						<header className="sticky top-0 z-50 h-[62px]">
							<div className="container mx-auto flex items-center justify-between whitespace-nowrap px-4 sm:px-6 lg:px-8 py-4">
								<div className="flex items-center gap-3 text-gray-900 text-xl font-bold">
									<Image src="/sitelogo.png" alt="NearBlood" width={200} height={100} className="object-contain w-[150px]" />
								</div>

								{/* <nav className="hidden md:flex items-center gap-8">
									<a className="text-sm font-medium !text-gray-700" href="#">
										About
									</a>
									<a className="text-sm font-medium !text-gray-700" href="#">
										How it Works
									</a>
									<a className="text-sm font-medium !text-gray-700" href="#">
										Contact
									</a>
								</nav> */}

								<div className="flex items-center gap-2">
									<AuthButtons />
								</div>
							</div>
						</header>

						{/* Hero Section */}
						<main className="flex-1">
							<section
								className="relative flex items-center justify-center min-h-[60vh] md:min-h-[75vh] bg-cover bg-center bg-no-repeat px-4 py-20"
								style={{
									backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url("/bg.png")',
								}}>
								<div className="container mx-auto text-center text-white">
									<h1 className="text-4xl md:text-6xl font-extrabold leading-tight uppercase tracking-tighter mb-4">Give the Gift of Life</h1>
									<p className="max-w-[800px] mx-auto text-lg md:text-xl font-semibold text-gray-200 mb-6">We are currently onboarding NGOs, organizations, and clubs working in blood donation. Blood request and other features are not active at the moment.</p>
									{/* <p className="max-w-2xl mx-auto text-lg md:text-xl font-semibold text-gray-200 mb-6">Every 2 seconds, someone needs blood. Connect with verified donors and recipients in your community. Your donation can save up to 3 lives.</p> */}
									{/* <div className="max-w-lg mx-auto text-sm md:text-base text-gray-300 mb-8">
										<p>Join thousands of heroes who have already donated and helped save lives across the globe. Quick registration, instant matching, verified safety.</p>
									</div> */}
									<div className="flex flex-wrap gap-4 justify-center">
										<Button onClick={() => message.info("This feature is not active yet")} icon={<HeartOutlined />} type="primary" className="!h-[44px] !font-semibold !px-6">
											Request Blood
										</Button>
										<Button onClick={() => router.push("/ngo/dashboard")} type="default" className="!h-[44px] !font-semibold !px-6 !bg-white/10 !border-white/30 !text-white hover:!bg-white/20">
											Register NGO
										</Button>
									</div>
								</div>
							</section>

							{/* How It Works */}
							{/* <section className="py-16 sm:py-24">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">How It Works</h2>
										<p className="mt-4 text-lg font-medium text-gray-600">Our platform streamlines the blood donation process, connecting verified donors with urgent requests in real-time. Simple, safe, and life-saving.</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
										{[
											{
												icon: <HeartOutlined className="text-2xl !text-red-500" />,
												title: "Request Blood",
												desc: "Create urgent requests with your location and blood type. Get matched with verified donors within 5km radius quickly.",
											},
											{
												icon: <UsergroupAddOutlined className="text-2xl !text-red-500" />,
												title: "Smart Matching",
												desc: "Our advanced algorithm connects compatible donors based on location, blood type, and availability for fastest response times.",
											},
											{
												icon: <SafetyCertificateOutlined className="text-2xl !text-red-500" />,
												title: "Verified & Safe",
												desc: "All donors undergo health screening. Blood is tested for safety. Track donation history and receive certificates.",
											},
										].map((item) => (
											<div key={item.title} className="flex flex-col gap-4 border rounded shadow p-6 text-center items-center bg-white">
												<div className="flex items-center bg-red-100 justify-center h-12 w-12 rounded-full">{item.icon}</div>
												<h3 className="text-2xl font-bold text-gray-900">{item.title}</h3>
												<p className="font-medium text-gray-500">{item.desc}</p>
											</div>
										))}
									</div>
								</div>
							</section> */}

							{/* Statistics */}
							{/* <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-800 via-gray-700 to-slate-800">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-4xl mx-auto text-center text-white">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Making a Real Impact</h2>
										<p className="text-lg text-gray-200 mb-12">Together, we&apos;re building the largest community of blood donors worldwide</p>

										<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
											<div className="text-center">
												<div className="text-3xl md:text-4xl font-bold text-white mb-2">100+</div>
												<div className="text-sm md:text-base text-gray-200">Lives Saved</div>
											</div>
											<div className="text-center">
												<div className="text-3xl md:text-4xl font-bold text-white mb-2">100+</div>
												<div className="text-sm md:text-base text-gray-200">Active Donors</div>
											</div>
											<div className="text-center">
												<div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
												<div className="text-sm md:text-base text-gray-200">Partner NGOs</div>
											</div>
											<div className="text-center">
												<div className="text-3xl md:text-4xl font-bold text-white mb-2">100+</div>
												<div className="text-sm md:text-base text-gray-200">Cities Covered</div>
											</div>
										</div>
									</div>
								</div>
							</section> */}

							{/* Need blood */}
							{/* <section className="bg-primary/5 dark:bg-primary/10 py-16 sm:py-24">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-3xl mx-auto text-center">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Need Blood Urgently?</h2>
										<p className="mt-4 text-lg text-gray-600 font-medium">Don&apos;t wait in uncertainty. Connect instantly with verified donors in your area.</p>
										<div className="mt-6 text-sm text-gray-500">
											<p>✓ 24/7 Emergency Support • ✓ GPS-Based Donor Matching • ✓ Real-time Updates</p>
										</div>
										<div className="mt-8 flex flex-wrap gap-4 justify-center">
											<Button icon={<HeartOutlined />} type="primary" className="!h-[44px] !font-semibold !px-6">
												Request Blood Now
											</Button>
											<Button type="default" className="!h-[44px] !font-semibold !px-6">
												Emergency Hotline
											</Button>
										</div>
									</div>
								</div>
							</section> */}

							{/* Why Donate */}
							{/* <section className="py-16 sm:py-24 bg-red-50">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-6">Why Donate Blood?</h2>
										<p className="text-lg font-medium text-gray-600 mb-4">One donation can save up to 3 lives. Join the heroic community that gives the ultimate gift - life itself.</p>
										<div className="w-24 h-1 bg-gradient-to-r from-red-400 to-red-500 rounded-full mx-auto"></div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
										{[
											{
												icon: <HeartOutlined className="text-3xl !text-red-500" />,
												title: "Save Lives Daily",
												desc: "Your single donation can help cancer patients, accident victims, and surgical patients. Be someone&apos;s hero today.",
												bgColor: "bg-white",
												iconBg: "bg-red-100",
											},
											{
												icon: <UsergroupAddOutlined className="text-3xl !text-green-600" />,
												title: "Health Benefits",
												desc: "Regular donors enjoy health screenings, reduced heart disease risk, and the satisfaction of helping others.",
												bgColor: "bg-white",
												iconBg: "bg-green-100",
											},
											{
												icon: <SafetyCertificateOutlined className="text-3xl !text-blue-600" />,
												title: "Recognition & Rewards",
												desc: "Earn donor certificates, priority medical care, and join exclusive donor appreciation events and programs.",
												bgColor: "bg-white",
												iconBg: "bg-blue-100",
											},
										].map((item) => (
											<div key={item.title} className={`${item.bgColor} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center group hover:-translate-y-2 border border-gray-100`}>
												<div className={`${item.iconBg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>{item.icon}</div>
												<h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
												<p className="font-medium text-gray-600 leading-relaxed">{item.desc}</p>
											</div>
										))}
									</div>
								</div>
							</section> */}

							{/* For NGOs */}
							{/* <section className="bg-primary/5 dark:bg-primary/10 py-16 sm:py-24">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-3xl mx-auto text-center">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Partner with Us</h2>
										<p className="mt-4 text-lg text-gray-600 font-medium">Hospitals, NGOs, and blood banks - join our network to manage donations efficiently and save more lives.</p>
										<div className="mt-6 text-sm text-gray-500">
											<p>✓ Automated Donor Management • ✓ Real-time Request Tracking • ✓ Emergency Notification System</p>
										</div>
										<div className="mt-8 flex flex-wrap gap-4 justify-center">
											<Button icon={<UsergroupAddOutlined />} type="primary" className="!h-[44px] !font-semibold !px-6">
												Register Organization
											</Button>
											<Button type="default" className="!h-[44px] !font-semibold !px-6">
												Partnership Info
											</Button>
										</div>
									</div>
								</div>
							</section> */}

							{/* Testimonials */}
							{/* <section className="py-16 sm:py-24 bg-white">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Stories of Hope</h2>
										<p className="mt-4 text-lg font-medium text-gray-600">Real stories from donors and recipients who found life through our platform</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
										<div className="bg-red-50 rounded-lg p-6">
											<div className="text-red-500 text-4xl mb-4">&quot;</div>
											<p className="text-gray-700 mb-4">Thanks to BloodConnect, I found a donor for my daughter within 20 minutes. The platform saved her life during emergency surgery.</p>
											<div className="flex items-center">
												<div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center mr-3">
													<span className="text-red-600 font-semibold">RS</span>
												</div>
												<div>
													<div className="font-semibold text-gray-900">Rajesh Sharma</div>
													<div className="text-sm text-gray-500">Grateful Father</div>
												</div>
											</div>
										</div>

										<div className="bg-red-50 rounded-lg p-6">
											<div className="text-red-500 text-4xl mb-4">&quot;</div>
											<p className="text-gray-700 mb-4">I&apos;ve donated 15 times through this app. The process is smooth, and knowing I&apos;m helping someone gives me immense satisfaction.</p>
											<div className="flex items-center">
												<div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center mr-3">
													<span className="text-red-600 font-semibold">PM</span>
												</div>
												<div>
													<div className="font-semibold text-gray-900">Priya Mehta</div>
													<div className="text-sm text-gray-500">Regular Donor</div>
												</div>
											</div>
										</div>

										<div className="bg-red-50 rounded-lg p-6">
											<div className="text-red-500 text-4xl mb-4">&quot;</div>
											<p className="text-gray-700 mb-4">As an NGO, this platform helps us coordinate blood drives efficiently. We&apos;ve helped save over 200 lives this year alone.</p>
											<div className="flex items-center">
												<div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center mr-3">
													<span className="text-red-600 font-semibold">LH</span>
												</div>
												<div>
													<div className="font-semibold text-gray-900">LifeCare NGO</div>
													<div className="text-sm text-gray-500">Partner Organization</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</section> */}

							{/* Call to Action */}
							{/* <section className="py-16 sm:py-24 bg-gradient-to-r from-slate-800 via-slate-700 to-gray-800">
								<div className="container mx-auto px-4 sm:px-6 lg:px-8">
									<div className="max-w-3xl mx-auto text-center text-white">
										<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to Save Lives?</h2>
										<p className="text-lg text-gray-200 mb-8">Join thousands of heroes who have already made a difference. Your first donation could be someone&apos;s second chance at life.</p>
										<div className="flex flex-wrap gap-4 justify-center">
											<Button icon={<HeartOutlined />} type="primary" className="!h-[48px] !font-semibold !px-8 !bg-white !text-red-600 hover:!bg-gray-100">
												Become a Donor
											</Button>
											<Button type="default" className="!h-[48px] !font-semibold !px-8 !bg-transparent !border-white !text-white hover:!bg-white/10">
												Find Blood
											</Button>
										</div>
									</div>
								</div>
							</section> */}
						</main>

						{/* Footer */}
						<footer className="w-full border-t border-gray-200">
							<div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
								<div className="text-center mb-8">
									<div className="flex items-center justify-center gap-3 text-gray-900 text-2xl font-bold mb-4">
										{/* <HeartOutlined className="text-red-500" /> */}
										<Image src={"/sitelogo.png"} alt="NearBlood Logo" width={300} height={100} className="w-[200px]" />
									</div>
									<p className="text-gray-600 max-w-md mx-auto">Connecting hearts, saving lives. Building the world&apos;s largest community of blood donors and recipients.</p>
								</div>

								{/* <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											About Us
										</a>
									</div>
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											How It Works
										</a>
									</div>
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											Donor Guidelines
										</a>
									</div>
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											Emergency Support
										</a>
									</div>
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											Privacy Policy
										</a>
									</div>
									<div className="text-center">
										<a href="#" className="text-sm font-medium text-gray-600 hover:text-red-600">
											Terms of Service
										</a>
									</div>
								</nav> */}

								{/* <div className="flex justify-center gap-6 text-2xl mb-6">
									<a className="text-gray-400 hover:text-red-500 transition-colors" href="#" aria-label="Twitter">
										<TwitterOutlined />
									</a>
									<a className="text-gray-400 hover:text-red-500 transition-colors" href="#" aria-label="Facebook">
										<FacebookOutlined />
									</a>
									<a className="text-gray-400 hover:text-red-500 transition-colors" href="#" aria-label="LinkedIn">
										<LinkedinOutlined />
									</a>
								</div> */}

								<div className="text-center border-t border-gray-200 pt-6">
									<p className="text-xs text-gray-500">© 2025 NearBlood. All rights reserved. Saving lives together.</p>
									{/* <p className="text-xs text-gray-400 mt-1">Emergency Helpline: 1800-BLOOD-24 | Available 24/7</p> */}
								</div>
							</div>
						</footer>
					</div>
				</div>
			</div>
		</>
	);
}
