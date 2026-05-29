/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
"use client";
import React, { useState, useEffect } from "react";
import { Input, Typography, Card, Tag, Spin, Empty } from "antd";
import {
	FaPlaneDeparture,
	FaSearch,
	FaMapMarkerAlt,
	FaGlobeAmericas,
	FaInfoCircle,
} from "react-icons/fa";
import { search } from "@/service/search";

const { Title, Text } = Typography;

const Landing = () => {
	const [info, setInfo] = useState({
		query: "",
		results: [],
		loading: false,
		intentData: null,
		error: null,
	});

	useEffect(() => {
		const timeout = setTimeout(() => {
			fetchAirports();
		}, 800);
		return () => clearTimeout(timeout);
	}, [info.query]);

	const fetchAirports = async () => {
		setInfo((prev) => ({ ...prev, loading: true, error: null }));

		try {
			const response = await search(info.query);

			setInfo((prev) => ({
				...prev,
				results: response?.results || [],
				intentData: response?.intent || null,
				loading: false,
			}));
		} catch (err) {
			setInfo((prev) => ({
				...prev,
				error: "Failed to fetch results. Is the backend running?",
				loading: false,
			}));
		}
	};

	const handleInputChange = (e) => {
		setInfo((prev) => ({ ...prev, query: e.target.value }));
	};

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="flex flex-col items-center py-16 px-4 w-full">
				{/* Header Section */}
				<div className="flex flex-col items-center mb-8">
					<div className="flex items-center gap-3 mb-4">
						<FaPlaneDeparture size={32} color="#1677ff" />
						<Title level={2} className="!m-0 font-bold text-slate-900">
							Fly Fairly
						</Title>
					</div>
					<Text className="text-slate-500 text-lg">
						Intelligent Airport Search
					</Text>
				</div>

				{/* Search Box Container */}
				<div className="w-full max-w-[600px] flex flex-col gap-4">
					<Input
						size="large"
						placeholder="Search airports, cities, regions, or IATA codes..."
						prefix={<FaSearch color="#94a3b8" style={{ marginRight: "8px" }} />}
						value={info.query}
						onChange={handleInputChange}
						allowClear
						className="py-3 px-5 rounded-xl shadow-md border-none text-lg"
					/>

					{info.error && (
						<Text type="danger" className="text-center mt-4">
							{info.error}
						</Text>
					)}

					{/* Results Area */}
					<div className="flex flex-col gap-3 mt-4">
						{info.loading && (
							<div className="flex justify-center p-8">
								<Spin size="large" />
							</div>
						)}

						{!info.loading &&
							info.query.length >= 2 &&
							info.results.length === 0 && (
								<Empty description="No airports found for this query." />
							)}

						{!info.loading &&
							info.results.map((airport) => (
								<Card
									key={airport._id || airport.ident}
									style={{ body: { padding: "16px" } }}
									className="rounded-xl border border-slate-200 shadow-sm"
									hoverable
								>
									<div className="flex justify-between items-start">
										{/* Left Side: Name and Location */}
										<div className="flex flex-col gap-1">
											<div className="flex items-center gap-2">
												<Text className="font-semibold text-lg text-slate-900">
													{airport.name}
												</Text>
												{airport.tier === 1 && (
													<Tag color="blue">Global Hub</Tag>
												)}
												{airport.tier === 2 && <Tag color="cyan">Regional</Tag>}
											</div>

											<div className="flex items-center gap-4 text-slate-500">
												<span className="flex items-center gap-1">
													<FaMapMarkerAlt size={12} />
													{airport.municipality}, {airport.iso_region}
												</span>
												<span className="flex items-center gap-1">
													<FaGlobeAmericas size={12} />
													{airport.iso_country}
												</span>
											</div>
										</div>

										{/* Right Side: IATA Code */}
										<div className="bg-slate-100 px-3 py-2 rounded-md flex flex-col items-center">
											<Text className="font-extrabold text-xl text-slate-700">
												{airport.iata_code || "N/A"}
											</Text>
											<Text className="text-xs text-slate-400 font-semibold">
												IATA
											</Text>
										</div>
									</div>
								</Card>
							))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Landing;
