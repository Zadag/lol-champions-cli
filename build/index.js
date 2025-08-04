#!/usr/bin/env node
import React, { useState, useEffect, useMemo } from "react";
import { render, Text, Box, useInput, useApp, useStdin } from "ink";
import axios from "axios";
const API_BASE_URL = "http://localhost:3000";

// Enhanced styling components
const BorderBox = ({
  children,
  title,
  color = "blue",
  minWidth = 80,
  ...props
}) => /*#__PURE__*/React.createElement(Box, props, /*#__PURE__*/React.createElement(Box, {
  flexDirection: "column",
  borderStyle: "round",
  borderColor: color,
  padding: 1,
  minWidth: minWidth,
  width: "100%"
}, title && /*#__PURE__*/React.createElement(Text, {
  bold: true,
  color: color,
  textWrap: "truncate"
}, title), children));
const GradientText = ({
  children,
  colors = ["magenta", "cyan"]
}) => /*#__PURE__*/React.createElement(Text, {
  bold: true,
  color: colors[0]
}, children);
const StatusBadge = ({
  status,
  value
}) => {
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
  return /*#__PURE__*/React.createElement(Text, {
    color: getColor(),
    bold: true
  }, "[", value, "]");
};

// Helper function to get champion color
const getChampionColor = champion => {
  // Simple color assignment based on win rate or default
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
  const {
    isRawModeSupported
  } = useStdin();
  const [currentView, setCurrentView] = useState("menu");
  const [championData, setChampionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const {
    exit
  } = useApp();

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
  return /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    padding: 2,
    minWidth: 90
  }, /*#__PURE__*/React.createElement(BorderBox, {
    color: "magenta",
    marginBottom: 1,
    minWidth: 86
  }, /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    alignItems: "center"
  }, /*#__PURE__*/React.createElement(GradientText, {
    colors: ["magenta", "cyan"]
  }, "\uD83C\uDFC6 LEAGUE OF LEGENDS CHAMPION ANALYZER \uD83C\uDFC6")), /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray",
    italic: true
  }, "Your ultimate champion statistics companion"))), loading && /*#__PURE__*/React.createElement(LoadingView, null), error && /*#__PURE__*/React.createElement(ErrorView, {
    error: error,
    onRetry: fetchChampionData,
    isRawModeSupported: isRawModeSupported
  }), !loading && !error && championData && /*#__PURE__*/React.createElement(React.Fragment, null, currentView === "menu" && /*#__PURE__*/React.createElement(MainMenu, {
    onSelectBestChampions: () => setCurrentView("roles"),
    onSelectCounters: () => setCurrentView("search"),
    onUpdateData: updateChampionData,
    onExit: exit,
    isRawModeSupported: isRawModeSupported
  }), currentView === "roles" && /*#__PURE__*/React.createElement(RoleSelection, {
    roles: Object.keys(championData),
    onSelectRole: role => {
      setSelectedRole(role);
      setCurrentView("champions");
    },
    onBack: () => setCurrentView("menu"),
    isRawModeSupported: isRawModeSupported
  }), currentView === "champions" && /*#__PURE__*/React.createElement(ChampionList, {
    champions: championData[selectedRole],
    role: selectedRole,
    onBack: () => setCurrentView("roles"),
    isRawModeSupported: isRawModeSupported
  }), currentView === "search" && /*#__PURE__*/React.createElement(ChampionSearch, {
    championData: championData,
    onBack: () => setCurrentView("menu"),
    isRawModeSupported: isRawModeSupported
  })));
};

// Enhanced Loading Component
const LoadingView = () => /*#__PURE__*/React.createElement(BorderBox, {
  color: "yellow",
  title: "\u26A1 Loading Status"
}, /*#__PURE__*/React.createElement(Box, {
  justifyContent: "center",
  alignItems: "center",
  paddingY: 2
}, /*#__PURE__*/React.createElement(Text, {
  color: "yellow"
}, "\uD83D\uDD04 Fetching champion data from the Rift...")), /*#__PURE__*/React.createElement(Box, {
  justifyContent: "center"
}, /*#__PURE__*/React.createElement(Text, {
  color: "gray",
  italic: true
}, "This may take a few moments")));

// Enhanced Error Component
const ErrorView = ({
  error,
  onRetry,
  isRawModeSupported
}) => {
  if (isRawModeSupported) {
    useInput((input, key) => {
      if (key.return) {
        onRetry();
      }
    });
  }
  return /*#__PURE__*/React.createElement(BorderBox, {
    color: "red",
    title: "\u274C Error Encountered"
  }, /*#__PURE__*/React.createElement(Box, {
    paddingY: 1
  }, /*#__PURE__*/React.createElement(Text, {
    color: "red",
    bold: true
  }, error)), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    paddingTop: 1
  }, /*#__PURE__*/React.createElement(Text, {
    color: "white",
    backgroundColor: "red",
    bold: true
  }, "Press ENTER to retry")));
};

// Enhanced Main Menu Component
const MainMenu = ({
  onSelectBestChampions,
  onSelectCounters,
  onUpdateData,
  onExit,
  isRawModeSupported
}) => {
  const [selectedOption, setSelectedOption] = useState(0);
  const options = [{
    label: "View Best Champions",
    icon: "📊",
    description: "Browse top performing champions by role",
    action: onSelectBestChampions,
    color: "cyan"
  }, {
    label: "Champion Counters",
    icon: "🛡️",
    description: "Find counters for specific champions",
    action: onSelectCounters,
    color: "yellow"
  }, {
    label: "Update Data",
    icon: "🔄",
    description: "Refresh champion statistics",
    action: onUpdateData,
    color: "green"
  }, {
    label: "Exit Application",
    icon: "🚪",
    description: "Close the champion analyzer",
    action: onExit,
    color: "red"
  }];
  if (isRawModeSupported) {
    useInput((input, key) => {
      if (key.upArrow) {
        setSelectedOption(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedOption(prev => Math.min(options.length - 1, prev + 1));
      } else if (key.return) {
        options[selectedOption].action();
      }
    });
  }
  return /*#__PURE__*/React.createElement(BorderBox, {
    color: "blue",
    title: "\uD83C\uDFAE Main Menu",
    minWidth: 70
  }, /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    paddingY: 1,
    minWidth: 65
  }, options.map((option, index) => {
    const isSelected = selectedOption === index;
    return /*#__PURE__*/React.createElement(Box, {
      key: index,
      flexDirection: "column",
      width: "100%"
    }, /*#__PURE__*/React.createElement(Box, {
      paddingX: 2,
      paddingY: 0,
      backgroundColor: isSelected ? option.color : undefined,
      width: "100%",
      minWidth: 60
    }, /*#__PURE__*/React.createElement(Text, {
      color: isSelected ? "black" : option.color,
      bold: isSelected
    }, isSelected ? "► " : "  ", option.icon, " ", option.label)), isSelected && /*#__PURE__*/React.createElement(Box, {
      paddingLeft: 4,
      paddingY: 0,
      width: "100%"
    }, /*#__PURE__*/React.createElement(Text, {
      color: "gray",
      italic: true
    }, option.description)));
  })), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    paddingTop: 1,
    borderTop: true,
    borderColor: "gray",
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "\u2191\u2193 Navigate \u2022 ENTER Select")));
};

// Enhanced Role Selection Component
const RoleSelection = ({
  roles,
  onSelectRole,
  onBack,
  isRawModeSupported
}) => {
  const [selectedRole, setSelectedRole] = useState(0);
  const roleIcons = {
    top: "⚔️",
    jungle: "🌿",
    mid: "✨",
    adc: "🏹",
    support: "🛡️"
  };
  const roleColor = "cyan"; // Fixed: define roleColor

  if (isRawModeSupported) {
    useInput((input, key) => {
      if (key.upArrow) {
        setSelectedRole(prev => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedRole(prev => Math.min(roles.length - 1, prev + 1));
      } else if (key.return) {
        onSelectRole(roles[selectedRole]);
      } else if (key.escape || input === "q") {
        onBack();
      }
    });
  }
  return /*#__PURE__*/React.createElement(BorderBox, {
    color: "cyan",
    title: "\uD83C\uDFAF Select Your Role",
    minWidth: 60
  }, /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    paddingY: 1,
    width: "100%"
  }, roles.map((role, index) => {
    const isSelected = selectedRole === index;
    const roleIcon = roleIcons[role.toLowerCase()] || "🎮";
    return /*#__PURE__*/React.createElement(Box, {
      key: role,
      paddingX: 2,
      paddingY: 0,
      backgroundColor: isSelected ? roleColor : undefined,
      marginY: 0,
      width: "100%",
      minWidth: 50
    }, /*#__PURE__*/React.createElement(Text, {
      color: isSelected ? "black" : roleColor,
      bold: isSelected
    }, isSelected ? "► " : "  ", roleIcon, " ", role.toUpperCase()));
  })), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    paddingTop: 1,
    borderTop: true,
    borderColor: "gray",
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "\u2191\u2193 Navigate \u2022 ENTER Select \u2022 ESC/Q Back")));
};

// Enhanced Champion List Component
const ChampionList = ({
  champions,
  role,
  onBack,
  isRawModeSupported
}) => {
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
        setCurrentPage(prev => prev - 1);
      } else if (key.rightArrow && currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (key.escape || input === "q") {
        onBack();
      }
    });
  }
  return /*#__PURE__*/React.createElement(BorderBox, {
    color: roleColor,
    title: `🏆 Best ${role.toUpperCase()} Champions`,
    minWidth: 80
  }, /*#__PURE__*/React.createElement(Box, {
    justifyContent: "space-between",
    paddingBottom: 1,
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "Showing ", startIndex + 1, "-", Math.min(endIndex, champions.length), " of", " ", champions.length), /*#__PURE__*/React.createElement(Text, {
    color: roleColor,
    bold: true
  }, "Page ", currentPage + 1, "/", totalPages)), /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    width: "100%"
  }, currentChampions.map((champion, index) => {
    const rank = startIndex + index + 1;
    const championColor = getChampionColor(champion);
    return /*#__PURE__*/React.createElement(Box, {
      key: champion.name,
      paddingY: 0,
      justifyContent: "space-between",
      width: "100%",
      minWidth: 70
    }, /*#__PURE__*/React.createElement(Box, null, /*#__PURE__*/React.createElement(Text, {
      color: "gray",
      bold: true
    }, "#", rank.toString().padStart(2, "0")), /*#__PURE__*/React.createElement(Text, {
      color: championColor,
      bold: true
    }, " ", champion.name)), /*#__PURE__*/React.createElement(Box, null, champion.winrate && /*#__PURE__*/React.createElement(StatusBadge, {
      status: "winrate",
      value: `WR: ${champion.winrate}`
    }), champion.pickRate && /*#__PURE__*/React.createElement(Text, null, " "), champion.pickRate && /*#__PURE__*/React.createElement(StatusBadge, {
      status: "pickrate",
      value: `PR: ${champion.pickRate}`
    })));
  })), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    paddingTop: 1,
    borderTop: true,
    borderColor: "gray",
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "\u2190 \u2192 Navigate Pages \u2022 ESC/Q Back to Roles")));
};

// Enhanced Champion Search Component
const ChampionSearch = ({
  championData,
  onBack,
  isRawModeSupported
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const allChampions = useMemo(() => Object.entries(championData).flatMap(([role, champions]) => champions.map(champion => ({
    ...champion,
    role
  }))), [championData]);
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
          setSelectedResultIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
          setSelectedResultIndex(prev => Math.min(searchResults.length - 1, prev + 1));
        } else if (key.return && searchResults.length > 0) {
          setSelectedChampion(searchResults[selectedResultIndex]);
        } else if (key.backspace || key.delete) {
          setSearchQuery(prev => prev.slice(0, -1));
        } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
          setSearchQuery(prev => prev + input);
        }
      }
    });
  }
  useEffect(() => {
    if (searchQuery.length > 0) {
      const results = allChampions.filter(champion => champion.name.toLowerCase().includes(searchQuery.toLowerCase()));
      setSearchResults(results.slice(0, 5));
      setSelectedResultIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allChampions]);
  if (selectedChampion) {
    return /*#__PURE__*/React.createElement(BorderBox, {
      color: "magenta",
      title: `🔍 ${selectedChampion.name} Details`
    }, /*#__PURE__*/React.createElement(Box, {
      flexDirection: "column",
      paddingY: 1
    }, /*#__PURE__*/React.createElement(Box, {
      justifyContent: "space-between",
      paddingBottom: 1
    }, /*#__PURE__*/React.createElement(Text, {
      bold: true,
      color: "cyan"
    }, selectedChampion.name), /*#__PURE__*/React.createElement(Text, {
      color: "yellow",
      bold: true
    }, selectedChampion.role.toUpperCase())), /*#__PURE__*/React.createElement(Box, {
      flexDirection: "column",
      paddingY: 1
    }, /*#__PURE__*/React.createElement(Text, {
      bold: true,
      color: "white"
    }, "\uD83D\uDCCA Statistics:"), /*#__PURE__*/React.createElement(Box, {
      justifyContent: "space-between",
      paddingLeft: 2
    }, selectedChampion.winrate && /*#__PURE__*/React.createElement(Text, {
      color: "green"
    }, "Win Rate: ", /*#__PURE__*/React.createElement(Text, {
      bold: true
    }, selectedChampion.winrate)), selectedChampion.pickRate && /*#__PURE__*/React.createElement(Text, {
      color: "yellow"
    }, "Pick Rate: ", /*#__PURE__*/React.createElement(Text, {
      bold: true
    }, selectedChampion.pickRate)))), selectedChampion.counters && selectedChampion.counters.length > 0 ? /*#__PURE__*/React.createElement(Box, {
      flexDirection: "column",
      paddingTop: 1
    }, /*#__PURE__*/React.createElement(Text, {
      bold: true,
      color: "red"
    }, "\uD83D\uDEE1\uFE0F Countered by:"), /*#__PURE__*/React.createElement(Box, {
      flexDirection: "column",
      paddingLeft: 2
    }, selectedChampion.counters.slice(0, 5).map((counter, index) => /*#__PURE__*/React.createElement(Text, {
      key: index,
      color: "red"
    }, "\u2022 ", counter)))) : /*#__PURE__*/React.createElement(Box, {
      paddingTop: 1
    }, /*#__PURE__*/React.createElement(Text, {
      color: "gray",
      italic: true
    }, "\uD83D\uDCAD No counter data available for this champion"))), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
      justifyContent: "center",
      paddingTop: 1,
      borderTop: true,
      borderColor: "gray"
    }, /*#__PURE__*/React.createElement(Text, {
      color: "gray"
    }, "ESC/Q Back to Search")));
  }
  return /*#__PURE__*/React.createElement(BorderBox, {
    color: "yellow",
    title: "\uD83D\uDD0D Champion Search",
    minWidth: 75
  }, /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    paddingY: 1,
    width: "100%"
  }, /*#__PURE__*/React.createElement(Box, {
    paddingBottom: 1,
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "white"
  }, "Search Query: "), /*#__PURE__*/React.createElement(Text, {
    color: "yellow",
    bold: true,
    backgroundColor: "gray"
  }, searchQuery || "Start typing...", "_")), isRawModeSupported ? /*#__PURE__*/React.createElement(React.Fragment, null, searchResults.length > 0 && /*#__PURE__*/React.createElement(Box, {
    flexDirection: "column",
    paddingTop: 1,
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    bold: true,
    color: "cyan"
  }, "\uD83C\uDFAF Results:"), searchResults.map((champion, index) => {
    const isSelected = index === selectedResultIndex;
    const roleColors = {
      top: "red",
      jungle: "green",
      mid: "magenta",
      adc: "yellow",
      support: "cyan"
    };
    const roleColor = roleColors[champion.role.toLowerCase()] || "white";
    return /*#__PURE__*/React.createElement(Box, {
      key: `${champion.name}-${champion.role}`,
      paddingX: 1,
      backgroundColor: isSelected ? roleColor : undefined,
      width: "100%",
      minWidth: 60
    }, /*#__PURE__*/React.createElement(Text, {
      color: isSelected ? "black" : roleColor,
      bold: isSelected
    }, isSelected ? "► " : "  ", champion.name), /*#__PURE__*/React.createElement(Text, {
      color: isSelected ? "black" : "gray"
    }, "(", champion.role.toUpperCase(), ")"));
  })), searchQuery.length > 0 && searchResults.length === 0 && /*#__PURE__*/React.createElement(Box, {
    paddingTop: 1,
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "red"
  }, "\u274C No champions found matching \"", searchQuery, "\""))) : /*#__PURE__*/React.createElement(Text, {
    color: "red",
    bold: true
  }, "\u26A0\uFE0F Interactive search requires a compatible terminal")), isRawModeSupported && /*#__PURE__*/React.createElement(Box, {
    justifyContent: "center",
    paddingTop: 1,
    borderTop: true,
    borderColor: "gray",
    width: "100%"
  }, /*#__PURE__*/React.createElement(Text, {
    color: "gray"
  }, "Type to Search \u2022 \u2191\u2193 Navigate \u2022 ENTER View Details \u2022 ESC/Q Back")));
};

// Render the app
render(/*#__PURE__*/React.createElement(App, null));
export default App;