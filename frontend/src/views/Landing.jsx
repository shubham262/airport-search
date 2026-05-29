/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
"use client";
import React, { useState, useEffect } from "react";
import { Input, Typography, Card, Tag, Spin, Empty, Layout } from "antd";
import {
	FaPlaneDeparture,
	FaSearch,
	FaMapMarkerAlt,
	FaGlobeAmericas,
	FaInfoCircle,
} from "react-icons/fa";
import { search } from "@/service/search";

const { Title, Text } = Typography;
const { Content } = Layout;

const Landing = () => {
	const [info, setInfo] = useState({
		query: "",
		results: [],
		loading: false,
		intentData: null,
		error: null,
	});

	useEffect(() => {
		// const delayDebounceFn = setTimeout(() => {
		fetchAirports();
		// }, 500);

		// return () => clearTimeout(delayDebounceFn);
	}, [info.query]);

	const fetchAirports = async () => {
		if (info.query.length < 2) {
			setInfo((prev) => ({
				...prev,
				results: [],
				intentData: null,
				error: null,
			}));
			return;
		}

		setInfo((prev) => ({ ...prev, loading: true, error: null }));

		try {
			const { data } = await search(info.query);
			console.log("Search API Response:", data);
			setInfo((prev) => ({
				...prev,
				results: data.results || [],
				intentData: data.intent || null,
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
		<Layout style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
			<Content
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					padding: "4rem 1rem",
					width: "100%",
				}}
			>
				{/* Header Section */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						marginBottom: "2rem",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.75rem",
							marginBottom: "1rem",
						}}
					>
						<FaPlaneDeparture size={32} color="#1677ff" />
						<Title
							level={2}
							style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}
						>
							Fly Fairly
						</Title>
					</div>
					<Text style={{ color: "#64748b", fontSize: "1.1rem" }}>
						Intelligent Airport Search
					</Text>
				</div>

				{/* Search Box Container */}
				<div
					style={{
						width: "100%",
						maxWidth: "600px",
						display: "flex",
						flexDirection: "column",
						gap: "1rem",
					}}
				>
					<Input
						size="large"
						placeholder="Search airports, cities, regions, or IATA codes..."
						prefix={<FaSearch color="#94a3b8" style={{ marginRight: "8px" }} />}
						value={info.query}
						onChange={handleInputChange}
						allowClear
						style={{
							padding: "12px 20px",
							borderRadius: "12px",
							boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
							border: "none",
							fontSize: "1.1rem",
						}}
					/>

					{/* Grader / Debug Panel - Shows LLM Intent Routing */}
					{info.intentData && (
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
								padding: "12px",
								backgroundColor: "#eff6ff",
								borderRadius: "8px",
								border: "1px solid #bfdbfe",
							}}
						>
							<FaInfoCircle color="#3b82f6" />
							<Text style={{ color: "#1e3a8a", fontSize: "0.9rem" }}>
								<strong>LLM Intent:</strong>{" "}
								{info.intentData.intent.toUpperCase()} |
								<strong> Normalized:</strong> {info.intentData.normalized_query}
								{info.intentData.region_code &&
									` | Region: ${info.intentData.region_code}`}
							</Text>
						</div>
					)}

					{info.error && (
						<Text
							type="danger"
							style={{ textAlign: "center", marginTop: "1rem" }}
						>
							{info.error}
						</Text>
					)}

					{/* Results Area */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							marginTop: "1rem",
						}}
					>
						{info.loading && (
							<div
								style={{
									display: "flex",
									justifyContent: "center",
									padding: "2rem",
								}}
							>
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
									bodyStyle={{ padding: "16px" }}
									style={{
										borderRadius: "10px",
										border: "1px solid #e2e8f0",
										boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
									}}
									hoverable
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
										}}
									>
										{/* Left Side: Name and Location */}
										<div
											style={{
												display: "flex",
												flexDirection: "column",
												gap: "4px",
											}}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "8px",
												}}
											>
												<Text
													style={{
														fontWeight: 600,
														fontSize: "1.1rem",
														color: "#0f172a",
													}}
												>
													{airport.name}
												</Text>
												{airport.tier === 1 && (
													<Tag color="blue">Global Hub</Tag>
												)}
												{airport.tier === 2 && <Tag color="cyan">Regional</Tag>}
											</div>

											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "16px",
													color: "#64748b",
												}}
											>
												<span
													style={{
														display: "flex",
														alignItems: "center",
														gap: "4px",
													}}
												>
													<FaMapMarkerAlt size={12} />
													{airport.municipality}, {airport.iso_region}
												</span>
												<span
													style={{
														display: "flex",
														alignItems: "center",
														gap: "4px",
													}}
												>
													<FaGlobeAmericas size={12} />
													{airport.iso_country}
												</span>
											</div>
										</div>

										{/* Right Side: IATA Code */}
										<div
											style={{
												backgroundColor: "#f1f5f9",
												padding: "8px 12px",
												borderRadius: "6px",
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
											}}
										>
											<Text
												style={{
													fontWeight: 800,
													fontSize: "1.2rem",
													color: "#334155",
												}}
											>
												{airport.iata_code || "N/A"}
											</Text>
											<Text
												style={{
													fontSize: "0.7rem",
													color: "#94a3b8",
													fontWeight: 600,
												}}
											>
												IATA
											</Text>
										</div>
									</div>
								</Card>
							))}
					</div>
				</div>
			</Content>
		</Layout>
	);
};

export default Landing;
