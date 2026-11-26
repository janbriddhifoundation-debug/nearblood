/**
 * Utility functions for handling BigInt serialization issues
 */

/**
 * Converts BigInt values to numbers in an object or array
 * This is useful when working with Prisma raw queries that return BigInt values
 * which cannot be serialized to JSON by default.
 */
export function convertBigIntToNumber<T extends Record<string, unknown>>(data: T | T[]): T | T[] {
	if (Array.isArray(data)) {
		return data.map((item) => convertBigIntToNumber(item)) as T[];
	}

	if (data === null || data === undefined || typeof data !== "object") {
		return data;
	}

	const converted = {...data} as Record<string, unknown>;

	for (const [key, value] of Object.entries(converted)) {
		if (typeof value === "bigint") {
			// Convert BigInt to number
			// Note: This may lose precision for very large numbers
			converted[key] = Number(value);
		} else if (typeof value === "object" && value !== null) {
			// Recursively handle nested objects
			converted[key] = convertBigIntToNumber(value as Record<string, unknown>);
		}
	}

	return converted as T;
}

/**
 * JSON replacer function that can be used with JSON.stringify to handle BigInt values
 * Usage: JSON.stringify(data, bigIntReplacer)
 */
export function bigIntReplacer(key: string, value: unknown): unknown {
	if (typeof value === "bigint") {
		return Number(value);
	}
	return value;
}
