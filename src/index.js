#!/usr/bin/env node

import React, { useState, useEffect, useMemo } from "react";
import { render, Text, Box, useInput, useApp, useStdin } from "ink";
import axios from "axios";

const API_BASE_URL = "http://35.208.176.209:3000";

const BorderBox = ({
	children,
	title,
	color = "blue",
	minWidth = 80,
	...props
}) => (
	<Box {...props}>
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={color}
			padding={1}
			minWidth={minWidth}
			width="100%"
		>
			{title && (
				<Text bold color={color} textWrap="truncate">
					{title}
				</Text>
			)}
			{children}
		</Box>
	</Box>
);

const GradientText = ({ children, colors = ["magenta", "cyan"] }) => (
	<Text bold color={colors[0]}>
		{children}
	</Text>
);

const StatusBadge = ({ status, value }) => {
	const getColor = () => {
		switch (status) {
			case "winrate":
				return "green";
			case "pickrate":
				return "yellow";
			case "counter":
				return "red";
			default:
				return "gray";
		}
	};

	return (
		<Text color={getColor()} bold>
			[{value}]
		</Text>
	);
};

// Helper function to get champion color
const getChampionColor = (champion) => {
	if (champion.winrate) {
		const winrateNum = parseFloat(champion.winrate.replace("%", ""));
		if (winrateNum >= 52) return "green";
		if (winrateNum >= 50) return "yellow";
		return "red";
	}
	return "cyan";
};

// Main App Component
const App = () => {
	const { isRawModeSupported } = useStdin();
	const [currentView, setCurrentView] = useState("menu");
	const [championData, setChampionData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [selectedRole, setSelectedRole] = useState(null);
	const { exit } = useApp();

	// Fetch champion data from API
	const fetchChampionData = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await axios.get(`${API_BASE_URL}/champion-data`);
			setChampionData(response.data);
		} catch (err) {
			setError(`Failed to fetch data: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Update champion data from API
	const updateChampionData = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await axios.get(`${API_BASE_URL}/update`);
			setChampionData(response.data.data);
		} catch (err) {
			if (err.response && err.response.status === 429) {
				setError(err.response.data.message);
			} else {
				setError(`Failed to update data: ${err.message}`);
			}
		} finally {
			setLoading(false);
		}
	};

	// Load data on app start
	useEffect(() => {
		fetchChampionData();
	}, []);

	return (
		<Box flexDirection="column" padding={2} minWidth={90}>
			{/* Header */}
			<BorderBox color="magenta" marginBottom={1} minWidth={86}>
				<Box justifyContent="center" alignItems="center">
					<GradientText colors={["magenta", "cyan"]}>
						🏆 LEAGUE OF LEGENDS STATS 🏆
					</GradientText>
				</Box>
				<Box justifyContent="center">
					<Text color="gray" italic>
						A minimalist way to check matchups/counters
					</Text>
				</Box>
			</BorderBox>

			{loading && <LoadingView />}
			{error && (
				<ErrorView
					error={error}
					onRetry={fetchChampionData}
					isRawModeSupported={isRawModeSupported}
				/>
			)}

			{!loading && !error && championData && (
				<>
					{currentView === "menu" && (
						<MainMenu
							onSelectBestChampions={() => setCurrentView("roles")}
							onSelectCounters={() => setCurrentView("search")}
							onUpdateData={updateChampionData}
							onExit={exit}
							isRawModeSupported={isRawModeSupported}
						/>
					)}

					{currentView === "roles" && (
						<RoleSelection
							roles={Object.keys(championData)}
							onSelectRole={(role) => {
								setSelectedRole(role);
								setCurrentView("champions");
							}}
							onBack={() => setCurrentView("menu")}
							isRawModeSupported={isRawModeSupported}
						/>
					)}

					{currentView === "champions" && (
						<ChampionList
							champions={championData[selectedRole]}
							role={selectedRole}
							onBack={() => setCurrentView("roles")}
							isRawModeSupported={isRawModeSupported}
						/>
					)}

					{currentView === "search" && (
						<ChampionSearch
							championData={championData}
							onBack={() => setCurrentView("menu")}
							isRawModeSupported={isRawModeSupported}
						/>
					)}
				</>
			)}
		</Box>
	);
};

const LoadingView = () => (
	<BorderBox color="yellow" title="⚡ Loading Status">
		<Box justifyContent="center" alignItems="center" paddingY={2}>
			<Text color="yellow">🔄 Fetching champion data from the Rift...</Text>
		</Box>
		<Box justifyContent="center">
			<Text color="gray" italic>
				This may take a few moments
			</Text>
		</Box>
	</BorderBox>
);

const ErrorView = ({ error, onRetry, isRawModeSupported }) => {
	if (isRawModeSupported) {
		useInput((input, key) => {
			if (key.return) {
				onRetry();
			}
		});
	}

	return (
		<BorderBox color="red" title="❌ Error Encountered">
			<Box paddingY={1}>
				<Text color="red" bold>
					{error}
				</Text>
			</Box>
			{isRawModeSupported && (
				<Box justifyContent="center" paddingTop={1}>
					<Text color="white" backgroundColor="red" bold>
						Press ENTER to retry
					</Text>
				</Box>
			)}
		</BorderBox>
	);
};

const MainMenu = ({
	onSelectBestChampions,
	onSelectCounters,
	onUpdateData,
	onExit,
	isRawModeSupported,
}) => {
	const [selectedOption, setSelectedOption] = useState(0);
	const options = [
		{
			label: "View Best Champions",
			icon: "📊",
			description: "Browse top performing champions by role",
			action: onSelectBestChampions,
			color: "cyan",
		},
		{
			label: "Champion Counters",
			icon: "🛡️",
			description: "Find counters for specific champions",
			action: onSelectCounters,
			color: "yellow",
		},
		{
			label: "Update Data",
			icon: "🔄",
			description: "Refresh champion statistics",
			action: onUpdateData,
			color: "green",
		},
		{
			label: "Exit Application",
			icon: "🚪",
			description: "Close the champion analyzer",
			action: onExit,
			color: "red",
		},
	];

	if (isRawModeSupported) {
		useInput((input, key) => {
			if (key.upArrow) {
				setSelectedOption((prev) => Math.max(0, prev - 1));
			} else if (key.downArrow) {
				setSelectedOption((prev) => Math.min(options.length - 1, prev + 1));
			} else if (key.return) {
				options[selectedOption].action();
			}
		});
	}

	return (
		<BorderBox color="blue" title="🎮 Main Menu" minWidth={70}>
			<Box flexDirection="column" paddingY={1} minWidth={65}>
				{options.map((option, index) => {
					const isSelected = selectedOption === index;
					return (
						<Box key={index} flexDirection="column" width="100%">
							<Box
								paddingX={2}
								paddingY={0}
								backgroundColor={isSelected ? option.color : undefined}
								width="100%"
								minWidth={60}
							>
								<Text
									color={isSelected ? "black" : option.color}
									bold={isSelected}
								>
									{isSelected ? "► " : "  "}
									{option.icon} {option.label}
								</Text>
							</Box>
							{isSelected && (
								<Box paddingLeft={4} paddingY={0} width="100%">
									<Text color="gray" italic>
										{option.description}
									</Text>
								</Box>
							)}
						</Box>
					);
				})}
			</Box>

			{isRawModeSupported && (
				<Box
					justifyContent="center"
					paddingTop={1}
					borderTop
					borderColor="gray"
					width="100%"
				>
					<Text color="gray">↑↓ Navigate • ENTER Select</Text>
				</Box>
			)}
		</BorderBox>
	);
};

const RoleSelection = ({ roles, onSelectRole, onBack, isRawModeSupported }) => {
	const [selectedRole, setSelectedRole] = useState(0);

	const roleIcons = {
		top: "⚔️",
		jungle: "🌿",
		mid: "✨",
		adc: "🏹",
		support: "🛡️",
	};

	const roleColor = "cyan"; // Fixed: define roleColor

	if (isRawModeSupported) {
		useInput((input, key) => {
			if (key.upArrow) {
				setSelectedRole((prev) => Math.max(0, prev - 1));
			} else if (key.downArrow) {
				setSelectedRole((prev) => Math.min(roles.length - 1, prev + 1));
			} else if (key.return) {
				onSelectRole(roles[selectedRole]);
			} else if (key.escape || input === "q") {
				onBack();
			}
		});
	}

	return (
		<BorderBox color="cyan" title="🎯 Select Your Role" minWidth={60}>
			<Box flexDirection="column" paddingY={1} width="100%">
				{roles.map((role, index) => {
					const isSelected = selectedRole === index;
					const roleIcon = roleIcons[role.toLowerCase()] || "🎮";

					return (
						<Box
							key={role}
							paddingX={2}
							paddingY={0}
							backgroundColor={isSelected ? roleColor : undefined}
							marginY={0}
							width="100%"
							minWidth={50}
						>
							<Text color={isSelected ? "black" : roleColor} bold={isSelected}>
								{isSelected ? "► " : "  "}
								{roleIcon} {role.toUpperCase()}
							</Text>
						</Box>
					);
				})}
			</Box>

			{isRawModeSupported && (
				<Box
					justifyContent="center"
					paddingTop={1}
					borderTop
					borderColor="gray"
					width="100%"
				>
					<Text color="gray">↑↓ Navigate • ENTER Select • ESC/Q Back</Text>
				</Box>
			)}
		</BorderBox>
	);
};

const ChampionList = ({ champions, role, onBack, isRawModeSupported }) => {
	const [currentPage, setCurrentPage] = useState(0);
	const championsPerPage = 8;
	const totalPages = Math.ceil(champions.length / championsPerPage);

	const startIndex = currentPage * championsPerPage;
	const endIndex = startIndex + championsPerPage;
	const currentChampions = champions.slice(startIndex, endIndex);

	const roleColor = "cyan"; // Fixed: define roleColor

	if (isRawModeSupported) {
		useInput((input, key) => {
			if (key.leftArrow && currentPage > 0) {
				setCurrentPage((prev) => prev - 1);
			} else if (key.rightArrow && currentPage < totalPages - 1) {
				setCurrentPage((prev) => prev + 1);
			} else if (key.escape || input === "q") {
				onBack();
			}
		});
	}

	return (
		<BorderBox
			color={roleColor}
			title={`🏆 Best ${role.toUpperCase()} Champions`}
			minWidth={80}
		>
			{/* Page indicator */}
			<Box justifyContent="space-between" paddingBottom={1} width="100%">
				<Text color="gray">
					Showing {startIndex + 1}-{Math.min(endIndex, champions.length)} of{" "}
					{champions.length}
				</Text>
				<Text color={roleColor} bold>
					Page {currentPage + 1}/{totalPages}
				</Text>
			</Box>

			{/* Champions list */}
			<Box flexDirection="column" width="100%">
				{currentChampions.map((champion, index) => {
					const rank = startIndex + index + 1;
					const championColor = getChampionColor(champion);

					return (
						<Box
							key={champion.name}
							paddingY={0}
							justifyContent="space-between"
							width="100%"
							minWidth={70}
						>
							<Box>
								<Text color="gray" bold>
									#{rank.toString().padStart(2, "0")}
								</Text>
								<Text color={championColor} bold>
									{" "}
									{champion.name}
								</Text>
							</Box>
							<Box>
								{champion.winrate && (
									<StatusBadge
										status="winrate"
										value={`WR: ${champion.winrate}`}
									/>
								)}
								{champion.pickRate && <Text> </Text>}
								{champion.pickRate && (
									<StatusBadge
										status="pickrate"
										value={`PR: ${champion.pickRate}`}
									/>
								)}
							</Box>
						</Box>
					);
				})}
			</Box>

			{/* Navigation help */}
			{isRawModeSupported && (
				<Box
					justifyContent="center"
					paddingTop={1}
					borderTop
					borderColor="gray"
					width="100%"
				>
					<Text color="gray">← → Navigate Pages • ESC/Q Back to Roles</Text>
				</Box>
			)}
		</BorderBox>
	);
};

const ChampionSearch = ({ championData, onBack, isRawModeSupported }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [selectedChampion, setSelectedChampion] = useState(null);
	const [selectedResultIndex, setSelectedResultIndex] = useState(0);

	const allChampions = useMemo(
		() =>
			Object.entries(championData).flatMap(([role, champions]) =>
				champions.map((champion) => ({ ...champion, role }))
			),
		[championData]
	);

	if (isRawModeSupported) {
		useInput((input, key) => {
			if (key.escape || input === "q") {
				if (selectedChampion) {
					setSelectedChampion(null);
				} else {
					onBack();
				}
			} else if (!selectedChampion) {
				// Only handle these inputs when not viewing champion details
				if (key.upArrow) {
					setSelectedResultIndex((prev) => Math.max(0, prev - 1));
				} else if (key.downArrow) {
					setSelectedResultIndex((prev) =>
						Math.min(searchResults.length - 1, prev + 1)
					);
				} else if (key.return && searchResults.length > 0) {
					setSelectedChampion(searchResults[selectedResultIndex]);
				} else if (key.backspace || key.delete) {
					setSearchQuery((prev) => prev.slice(0, -1));
				} else if (input && input.length === 1 && !key.ctrl && !key.meta) {
					setSearchQuery((prev) => prev + input);
				}
			}
		});
	}

	useEffect(() => {
		if (searchQuery.length > 0) {
			const results = allChampions.filter((champion) =>
				champion.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
			setSearchResults(results.slice(0, 5));
			setSelectedResultIndex(0);
		} else {
			setSearchResults([]);
		}
	}, [searchQuery, allChampions]);

	if (selectedChampion) {
		return (
			<BorderBox color="magenta" title={`🔍 ${selectedChampion.name} Details`}>
				<Box flexDirection="column" paddingY={1}>
					{/* Champion header */}
					<Box justifyContent="space-between" paddingBottom={1}>
						<Text bold color="cyan">
							{selectedChampion.name}
						</Text>
						<Text color="yellow" bold>
							{selectedChampion.role.toUpperCase()}
						</Text>
					</Box>

					{/* Stats section */}
					<Box flexDirection="column" paddingY={1}>
						<Text bold color="white">
							📊 Statistics:
						</Text>
						<Box justifyContent="space-between" paddingLeft={2}>
							{selectedChampion.winrate && (
								<Text color="green">
									Win Rate: <Text bold>{selectedChampion.winrate}</Text>
								</Text>
							)}
							{selectedChampion.pickRate && (
								<Text color="yellow">
									Pick Rate: <Text bold>{selectedChampion.pickRate}</Text>
								</Text>
							)}
						</Box>
					</Box>

					{/* Counters section */}
					{selectedChampion.counters && selectedChampion.counters.length > 0 ? (
						<Box flexDirection="column" paddingTop={1}>
							<Text bold color="red">
								🛡️ Countered by:
							</Text>
							<Box flexDirection="column" paddingLeft={2}>
								{selectedChampion.counters.slice(0, 5).map((counter, index) => (
									<Text key={index} color="red">
										• {counter}
									</Text>
								))}
							</Box>
						</Box>
					) : (
						<Box paddingTop={1}>
							<Text color="gray" italic>
								💭 No counter data available for this champion
							</Text>
						</Box>
					)}
				</Box>

				{isRawModeSupported && (
					<Box
						justifyContent="center"
						paddingTop={1}
						borderTop
						borderColor="gray"
					>
						<Text color="gray">ESC/Q Back to Search</Text>
					</Box>
				)}
			</BorderBox>
		);
	}

	return (
		<BorderBox color="yellow" title="🔍 Champion Search" minWidth={75}>
			<Box flexDirection="column" paddingY={1} width="100%">
				{/* Search input display */}
				<Box paddingBottom={1} width="100%">
					<Text color="white">Search Query: </Text>
					<Text color="yellow" bold backgroundColor="gray">
						{searchQuery || "Start typing..."}_
					</Text>
				</Box>

				{isRawModeSupported ? (
					<>
						{/* Search results */}
						{searchResults.length > 0 && (
							<Box flexDirection="column" paddingTop={1} width="100%">
								<Text bold color="cyan">
									🎯 Results:
								</Text>
								{searchResults.map((champion, index) => {
									const isSelected = index === selectedResultIndex;
									const roleColors = {
										top: "red",
										jungle: "green",
										mid: "magenta",
										adc: "yellow",
										support: "cyan",
									};
									const roleColor =
										roleColors[champion.role.toLowerCase()] || "white";

									return (
										<Box
											key={`${champion.name}-${champion.role}`}
											paddingX={1}
											backgroundColor={isSelected ? roleColor : undefined}
											width="100%"
											minWidth={60}
										>
											<Text
												color={isSelected ? "black" : roleColor}
												bold={isSelected}
											>
												{isSelected ? "► " : "  "}
												{champion.name}
											</Text>
											<Text color={isSelected ? "black" : "gray"}>
												({champion.role.toUpperCase()})
											</Text>
										</Box>
									);
								})}
							</Box>
						)}

						{/* No results message */}
						{searchQuery.length > 0 && searchResults.length === 0 && (
							<Box paddingTop={1} width="100%">
								<Text color="red">
									❌ No champions found matching "{searchQuery}"
								</Text>
							</Box>
						)}
					</>
				) : (
					<Text color="red" bold>
						⚠️ Interactive search requires a compatible terminal
					</Text>
				)}
			</Box>

			{isRawModeSupported && (
				<Box
					justifyContent="center"
					paddingTop={1}
					borderTop
					borderColor="gray"
					width="100%"
				>
					<Text color="gray">
						Type to Search • ↑↓ Navigate • ENTER View Details • ESC/Q Back
					</Text>
				</Box>
			)}
		</BorderBox>
	);
};

render(<App />);

export default App;
