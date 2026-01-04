// Ticket to Ride - Scoring System
// Includes longest continuous route calculation

const LONGEST_ROUTE_BONUS = 10;

// Calculate longest continuous path for a player
function calculateLongestRoute(player) {
    const graph = player.getRouteGraph();
    const cities = Object.keys(graph);

    if (cities.length === 0) return 0;

    let longestPath = 0;

    // Try starting from each city
    for (const startCity of cities) {
        const pathLength = findLongestPathFromCity(graph, startCity);
        longestPath = Math.max(longestPath, pathLength);
    }

    return longestPath;
}

// DFS to find longest path from a starting city
function findLongestPathFromCity(graph, startCity) {
    let maxLength = 0;

    function dfs(city, usedRoutes, currentLength) {
        maxLength = Math.max(maxLength, currentLength);

        const neighbors = graph[city] || [];
        for (const neighbor of neighbors) {
            if (!usedRoutes.has(neighbor.routeId)) {
                usedRoutes.add(neighbor.routeId);
                dfs(neighbor.city, usedRoutes, currentLength + neighbor.length);
                usedRoutes.delete(neighbor.routeId);
            }
        }
    }

    dfs(startCity, new Set(), 0);
    return maxLength;
}

// Calculate final scores for all players
function calculateFinalScores(players) {
    const scores = [];

    // Calculate longest route for each player
    const longestRoutes = players.map(p => ({
        player: p,
        length: calculateLongestRoute(p)
    }));

    // Find the maximum longest route
    const maxRouteLength = Math.max(...longestRoutes.map(lr => lr.length));

    // Players with longest route (can be multiple)
    const longestRouteWinners = longestRoutes
        .filter(lr => lr.length === maxRouteLength && lr.length > 0)
        .map(lr => lr.player.id);

    for (const player of players) {
        const ticketStatuses = player.getAllTicketStatuses();

        // Route points (already accumulated)
        const routePoints = player.routePoints;

        // Destination ticket points
        let ticketPoints = 0;
        const completedTickets = [];
        const failedTickets = [];

        for (const status of ticketStatuses) {
            ticketPoints += status.points;
            if (status.completed) {
                completedTickets.push(status.ticket);
            } else {
                failedTickets.push(status.ticket);
            }
        }

        // Longest route bonus
        const hasLongestRoute = longestRouteWinners.includes(player.id);
        const longestRouteBonus = hasLongestRoute ? LONGEST_ROUTE_BONUS : 0;

        // Total score
        const totalScore = routePoints + ticketPoints + longestRouteBonus;

        scores.push({
            player: player,
            routePoints: routePoints,
            ticketPoints: ticketPoints,
            completedTickets: completedTickets,
            failedTickets: failedTickets,
            longestRouteLength: longestRoutes.find(lr => lr.player.id === player.id).length,
            hasLongestRoute: hasLongestRoute,
            longestRouteBonus: longestRouteBonus,
            totalScore: totalScore
        });
    }

    // Sort by total score (highest first)
    scores.sort((a, b) => {
        // Primary: total score
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }
        // Tiebreaker 1: completed tickets
        if (b.completedTickets.length !== a.completedTickets.length) {
            return b.completedTickets.length - a.completedTickets.length;
        }
        // Tiebreaker 2: longest route
        return b.longestRouteLength - a.longestRouteLength;
    });

    return scores;
}

// Calculate current score (during game, without destination ticket reveals)
function calculateCurrentScore(player) {
    return player.routePoints;
}

// Get score breakdown for display
function getScoreBreakdown(player) {
    const ticketStatuses = player.getAllTicketStatuses();
    const longestRoute = calculateLongestRoute(player);

    return {
        routePoints: player.routePoints,
        longestRoute: longestRoute,
        tickets: ticketStatuses,
        estimatedTotal: player.routePoints // During game, don't reveal ticket completion
    };
}

// Route length to points conversion
function getRoutePoints(length) {
    return MAP_DATA.routeScoring[length] || 0;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LONGEST_ROUTE_BONUS,
        calculateLongestRoute,
        calculateFinalScores,
        calculateCurrentScore,
        getScoreBreakdown,
        getRoutePoints
    };
}
