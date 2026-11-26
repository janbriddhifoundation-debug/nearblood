import React, {ReactNode} from "react";

const Show = ({IF, children}: {IF: boolean; children: ReactNode}) => {
	if (!IF) {
		return null;
	}
	return <>{children}</>;
};

export default Show;
