"use client";

import {AppProgressBar as ProgressBar} from "next-nprogress-bar";
import {Analytics} from "@vercel/analytics/next";

const Providers = ({children}: {children: React.ReactNode}) => {
	return (
		<>
			{children}
			<ProgressBar height="3px" color="#ff4d4f" options={{showSpinner: false}} shallowRouting />
			<Analytics />
		</>
	);
};

export default Providers;
