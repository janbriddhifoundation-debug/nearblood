import {Avatar, Table} from "antd";
import React, {useState} from "react";
import dayjs from "dayjs";

type Donor = {
	key?: React.Key;
	photo?: string;
	name: string;
	bloodGroup: string;
	dob: string; // ISO string or "YYYY-MM-DD"
	phone: string;
	address: string;
};

type NgoDonorsTableProps = {
	loading: boolean;
	donors: Donor[];
};

const NgoDonorsTable: React.FC<NgoDonorsTableProps> = ({loading, donors}) => {
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	// Helper to calculate age from DOB
	const calculateAge = (dob: string) => {
		return dayjs().diff(dayjs(dob), "year");
	};

	const dataSource = donors.map((item, i) => ({
		...item,
		key: i,
		age: calculateAge(item.dob),
	}));

	const columns = [
		{
			title: "Photo",
			dataIndex: "photo",
			render: (photo: string, record: Donor) => (
				<Avatar src={photo} alt={record.name}>
					{!photo && record.name.charAt(0)}
				</Avatar>
			),
		},
		{
			title: "Name",
			dataIndex: "name",
		},
		{
			title: "Blood Group",
			dataIndex: "bloodGroup",
		},
		{
			title: "Age",
			dataIndex: "age",
		},
		{
			title: "Contact",
			dataIndex: "phone",
		},
		{
			title: "Address",
			dataIndex: "address",
		},
	];

	return (
		<div className="bg-white border rounded-md border-gray-100">
			<Table
				rowSelection={{
					selectedRowKeys,
					onChange: setSelectedRowKeys,
				}}
				columns={columns}
				dataSource={dataSource}
				pagination={false}
				loading={loading}
			/>
		</div>
	);
};

export default NgoDonorsTable;
