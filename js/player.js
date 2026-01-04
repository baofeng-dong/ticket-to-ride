// Ticket to Ride - Player Management System

const STARTING_TRAINS = 45;
const INITIAL_CARDS = 4;

class Player {
    constructor(id, name, color, isAI = false) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.isAI = isAI;

        // Resources
        this.trainCards = [];
        this.destinationTickets = [];
        this.trainsRemaining = STARTING_TRAINS;

        // Claimed routes
        this.claimedRoutes = [];

        // Scoring
        this.routePoints = 0;

        // For AI: planned routes
        this.plannedRoutes = [];
    }

    // Add train cards to hand
    addTrainCards(cards) {
        this.trainCards.push(...cards);
    }

    // Remove specific cards from hand (returns the removed cards)
    removeTrainCards(color, count) {
        const removed = [];
        let remaining = count;

        for (let i = this.trainCards.length - 1; i >= 0 && remaining > 0; i--) {
            if (this.trainCards[i] === color) {
                removed.push(this.trainCards.splice(i, 1)[0]);
                remaining--;
            }
        }

        return removed;
    }

    // Get count of cards by color
    getCardCounts() {
        const counts = {};
        CARD_COLORS.forEach(c => counts[c] = 0);
        counts[LOCOMOTIVE] = 0;

        this.trainCards.forEach(card => {
            counts[card] = (counts[card] || 0) + 1;
        });

        return counts;
    }

    // Get total card count
    getTotalCards() {
        return this.trainCards.length;
    }

    // Add destination tickets
    addDestinationTickets(tickets) {
        this.destinationTickets.push(...tickets);
    }

    // Claim a route
    claimRoute(route, cardsUsed) {
        this.claimedRoutes.push({
            route: route,
            cardsUsed: cardsUsed
        });

        // Reduce trains
        this.trainsRemaining -= route.length;

        // Add route points
        this.routePoints += MAP_DATA.routeScoring[route.length];

        return true;
    }

    // Check if player can claim a specific route
    canClaimRoute(route) {
        // Check if has enough trains
        if (this.trainsRemaining < route.length) {
            return false;
        }

        // Check if has the cards
        const counts = this.getCardCounts();
        return canClaimRoute(this.trainCards, route.color, route.length);
    }

    // Get valid card combinations for a route
    getValidCombinations(route) {
        const counts = this.getCardCounts();
        return getValidCardCombinations(counts, route.color, route.length);
    }

    // Check if player has connected two cities
    hasConnectedCities(city1, city2) {
        if (city1 === city2) return true;

        // BFS to find path using only claimed routes
        const visited = new Set();
        const queue = [city1];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === city2) return true;

            if (visited.has(current)) continue;
            visited.add(current);

            // Find connected cities through claimed routes
            for (const claimed of this.claimedRoutes) {
                const route = claimed.route;
                if (route.cities[0] === current && !visited.has(route.cities[1])) {
                    queue.push(route.cities[1]);
                }
                if (route.cities[1] === current && !visited.has(route.cities[0])) {
                    queue.push(route.cities[0]);
                }
            }
        }

        return false;
    }

    // Check destination ticket completion status
    getTicketStatus(ticket) {
        const connected = this.hasConnectedCities(ticket.city1, ticket.city2);
        return {
            ticket: ticket,
            completed: connected,
            points: connected ? ticket.points : -ticket.points
        };
    }

    // Get all destination ticket statuses
    getAllTicketStatuses() {
        return this.destinationTickets.map(t => this.getTicketStatus(t));
    }

    // Calculate total score including destination tickets
    calculateTotalScore() {
        let total = this.routePoints;

        // Add/subtract destination ticket points
        for (const ticket of this.destinationTickets) {
            if (this.hasConnectedCities(ticket.city1, ticket.city2)) {
                total += ticket.points;
            } else {
                total -= ticket.points;
            }
        }

        return total;
    }

    // Get claimed cities (for longest route calculation)
    getClaimedCities() {
        const cities = new Set();
        for (const claimed of this.claimedRoutes) {
            cities.add(claimed.route.cities[0]);
            cities.add(claimed.route.cities[1]);
        }
        return Array.from(cities);
    }

    // Build adjacency list from claimed routes (for longest route)
    getRouteGraph() {
        const graph = {};

        for (const claimed of this.claimedRoutes) {
            const [city1, city2] = claimed.route.cities;
            const length = claimed.route.length;

            if (!graph[city1]) graph[city1] = [];
            if (!graph[city2]) graph[city2] = [];

            graph[city1].push({ city: city2, length: length, routeId: claimed.route.id });
            graph[city2].push({ city: city1, length: length, routeId: claimed.route.id });
        }

        return graph;
    }

    // Get player state for serialization
    getState() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            isAI: this.isAI,
            trainCards: [...this.trainCards],
            destinationTickets: this.destinationTickets.map(t => ({ ...t })),
            trainsRemaining: this.trainsRemaining,
            claimedRoutes: this.claimedRoutes.map(c => ({
                routeId: c.route.id,
                cardsUsed: [...c.cardsUsed]
            })),
            routePoints: this.routePoints
        };
    }

    // Restore player state
    loadState(state) {
        this.id = state.id;
        this.name = state.name;
        this.color = state.color;
        this.isAI = state.isAI;
        this.trainCards = [...state.trainCards];
        this.destinationTickets = state.destinationTickets.map(t => ({ ...t }));
        this.trainsRemaining = state.trainsRemaining;
        this.routePoints = state.routePoints;
        // Note: claimedRoutes need route objects, should be restored with full route data
    }
}

// Player manager class
class PlayerManager {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
    }

    // Add a player
    addPlayer(name, color, isAI = false) {
        const player = new Player(this.players.length, name, color, isAI);
        this.players.push(player);
        return player;
    }

    // Get current player
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Move to next player
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.getCurrentPlayer();
    }

    // Get player by ID
    getPlayer(id) {
        return this.players.find(p => p.id === id);
    }

    // Get all players
    getAllPlayers() {
        return this.players;
    }

    // Get player count
    getPlayerCount() {
        return this.players.length;
    }

    // Check if it's a specific player's turn
    isPlayerTurn(playerId) {
        return this.getCurrentPlayer().id === playerId;
    }

    // Get human player (for UI focus)
    getHumanPlayers() {
        return this.players.filter(p => !p.isAI);
    }

    // Get AI players
    getAIPlayers() {
        return this.players.filter(p => p.isAI);
    }

    // Reset for new game
    reset() {
        this.players = [];
        this.currentPlayerIndex = 0;
    }

    // Get scores sorted
    getSortedScores() {
        return this.players
            .map(p => ({
                player: p,
                score: p.calculateTotalScore()
            }))
            .sort((a, b) => b.score - a.score);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Player, PlayerManager, STARTING_TRAINS, INITIAL_CARDS };
}
