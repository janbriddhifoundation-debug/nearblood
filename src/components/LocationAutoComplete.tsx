import React, {useState, useRef} from "react";
import {Empty, Select, Spin} from "antd";
import axios from "axios";

interface LocationOption {
	label: string | React.ReactNode;
	value: string;
	lat?: string;
	lon?: string;
}

interface LocationData {
	location: string;
	lat: string;
	lon: string;
}

interface Props {
	multiple?: boolean;
	onSelectLocation: (locations: LocationData | LocationData[]) => void;
}

const LocationAutoComplete: React.FC<Props> = ({multiple = false, onSelectLocation}) => {
	const [options, setOptions] = useState<LocationOption[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedValues, setSelectedValues] = useState<string[]>([]);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	const fetchSuggestions = async (query: string) => {
		if (!query) return;

		try {
			setLoading(true);
			const {data} = await axios.get(`/api/v1/locations?query=${query}`);
			// Merge selected options with new options
			const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));
			const newOptions = data?.locations.filter(
				(opt: LocationOption) => !selectedValues.includes(opt.value)
			);
			setOptions([...selectedOptions, ...(newOptions || [])]);
		} catch (err) {
			console.error("Failed to fetch location suggestions:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (val: string[] | string) => {
		const values = Array.isArray(val) ? val : val ? [val] : [];
		setSelectedValues(values); // Track selected values

		const updatedLocations: LocationData[] = [];
		values.forEach((v) => {
			const selected = options.find((opt) => opt.value === v);
			if (selected) {
				updatedLocations.push({
					location: selected.label as string,
					lat: selected.lat!,
					lon: selected.lon!,
				});
			}
		});
		onSelectLocation(multiple ? updatedLocations : updatedLocations[0] ?? null);
	};

	const handleSearch = (val: string) => {
		setLoading(true);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => fetchSuggestions(val), 500);
	};

	return (
		<div>
			<Select
				mode={multiple ? "multiple" : undefined}
				allowClear
				showSearch
				style={{width: "100%"}}
				placeholder="Please search for a location"
				onChange={handleChange}
				onSearch={handleSearch}
				options={options}
				loading={loading}
				notFoundContent={
					loading ? (
						<div className="flex items-center justify-center py-2">
							<Spin size="small" />
						</div>
					) : (
						<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
					)
				}
			/>
		</div>
	);
};

export default LocationAutoComplete;
