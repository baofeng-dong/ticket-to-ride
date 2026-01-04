// Ticket to Ride - Smart AI Opponent
// Strategic AI that plans routes, collects cards, and blocks opponents

class AIPlayer {
    constructor(player, gameState) {
        this.player = player;
        this.gameState = gameState;
        this.plannedPath = [];
        this.targetColors = {};
        this.urgentRoutes = [];
    }

    // Main decision function - returns the action to take
    decideAction() {
        this.updateStrategy();

        // Priority 1: Claim urgent routes (about to be blocked or completing a ticket)
        const urgentClaim = this.findUrgentRouteToClaim();
        if (urgentClaim) {
            return { type: 'claim', route: urgentClaim.route, cards: urgentClaim.cards };
        }

        // Priority 2: Claim routes on planned path if we have cards
        const plannedClaim = this.findPlannedRouteToClaim();
        if (plannedClaim) {
            return { type: 'claim', route: plannedClaim.route, cards: plannedClaim.cards };
        }

        // Priority 3: Draw cards if we need more
        if (this.shouldDrawCards()) {
            return this.decideCardDraw();
        }

        // Priority 4: Claim any beneficial route
        const opportunisticClaim = this.findOpportunisticClaim();
        if (opportunisticClaim) {
            return { type: 'claim', route: opportunisticClaim.route, cards: opportunisticClaim.cards };
        }

        // Priority 5: Draw more destination tickets if doing well
        if (this.shouldDrawDestinations()) {
            return { type: 'destinations' };
        }

        // Default: draw cards
        return this.decideCardDraw();
    }

    // Update AI strategy based on current game state
    updateStrategy() {
        this.analyzePlannedPath();
        this.identifyTargetColors();
        this.findUrgentRoutes();
    }

    // Analyze and plan the best path for destination tickets
    analyzePlannedPath() {
        this.plannedPath = [];

        for (const ticket of this.player.destinationTickets) {
            if (!this.player.hasConnectedCities(ticket.city1, ticket.city2)) {
                const path = this.findBestPath(ticket.city1, ticket.city2);
                if (path) {
                    this.plannedPath.push(...path.filter(r =>
                        !this.plannedPath.some(p => p.id === r.id)
                    ));
                }
            }
        }
    }

    // Find best path between two cities using available/claimable routes
    findBestPath(city1, city2) {
        const claimedByOthers = new Set(
            this.gameState.claimedRoutes
                .filter(cr => cr.playerId !== this.player.id)
                .map(cr => cr.routeId)
        );

        // Dijkstra's algorithm considering route availability
        const distances = {};
        const previous = {};
        const previousRoute = {};
        const unvisited = new Set(Object.keys(MAP_DATA.cities));

        Object.keys(MAP_DATA.cities).forEach(city => {
            distances[city] = Infinity;
        });
        distances[city1] = 0;

        while (unvisited.size > 0) {
            // Find unvisited city with minimum distance
            let current = null;
            let minDist = Infinity;
            for (const city of unvisited) {
                if (distances[city] < minDist) {
                    minDist = distances[city];
                    current = city;
                }
            }

            if (current === null || current === city2) break;
            unvisited.delete(current);

            // Check all routes from current city
            const routes = getRoutesFromCity(current);
            for (const route of routes) {
                // Skip if claimed by another player (unless there's a parallel)
                if (claimedByOthers.has(route.id)) {
                    // Check for parallel route
                    if (!route.parallel || claimedByOthers.has(route.parallel)) {
                        continue;
                    }
                }

                // Skip if already claimed by us
                if (this.player.claimedRoutes.some(cr => cr.route.id === route.id)) {
                    continue;
                }

                const neighbor = route.cities[0] === current ? route.cities[1] : route.cities[0];
                const newDist = distances[current] + route.length;

                if (newDist < distances[neighbor]) {
                    distances[neighbor] = newDist;
                    previous[neighbor] = current;
                    previousRoute[neighbor] = route;
                }
            }
        }

        // Reconstruct path
        if (distances[city2] === Infinity) return null;

        const path = [];
        let current = city2;
        while (previous[current]) {
            path.unshift(previousRoute[current]);
            current = previous[current];
        }

        return path;
    }

    // Identify which colors we need for planned routes
    identifyTargetColors() {
        this.targetColors = {};

        for (const route of this.plannedPath) {
            // Skip routes we already claimed
            if (this.player.claimedRoutes.some(cr => cr.route.id === route.id)) {
                continue;
            }

            const color = route.color;
            if (color === 'gray') {
                // For gray routes, determine best color based on hand
                const counts = this.player.getCardCounts();
                let bestColor = 'red';
                let bestCount = 0;
                for (const c of CARD_COLORS) {
                    if (counts[c] > bestCount) {
                        bestCount = counts[c];
                        bestColor = c;
                    }
                }
                this.targetColors[bestColor] = (this.targetColors[bestColor] || 0) + route.length;
            } else {
                this.targetColors[color] = (this.targetColors[color] || 0) + route.length;
            }
        }
    }

    // Find routes that might be blocked soon
    findUrgentRoutes() {
        this.urgentRoutes = [];

        for (const route of this.plannedPath) {
            // Skip if we already claimed it
            if (this.player.claimedRoutes.some(cr => cr.route.id === route.id)) {
                continue;
            }

            // Check if this is a bottleneck (only one route between cities)
            const routes = findRoute(route.cities[0], route.cities[1]);
            const availableRoutes = routes.filter(r =>
                !this.gameState.claimedRoutes.some(cr => cr.routeId === r.id)
            );

            if (availableRoutes.length === 1) {
                // This is a bottleneck - urgent!
                this.urgentRoutes.push(route);
            }
        }
    }

    // Find urgent route we can claim
    findUrgentRouteToClaim() {
        for (const route of this.urgentRoutes) {
            const combinations = this.player.getValidCombinations(route);
            if (combinations.length > 0) {
                return {
                    route: route,
                    cards: this.selectBestCombination(combinations)
                };
            }
        }
        return null;
    }

    // Find planned route we can claim
    findPlannedRouteToClaim() {
        for (const route of this.plannedPath) {
            // Skip if already claimed
            if (this.player.claimedRoutes.some(cr => cr.route.id === route.id)) {
                continue;
            }

            // Skip if claimed by others
            if (this.gameState.claimedRoutes.some(cr => cr.routeId === route.id)) {
                continue;
            }

            const combinations = this.player.getValidCombinations(route);
            if (combinations.length > 0) {
                return {
                    route: route,
                    cards: this.selectBestCombination(combinations)
                };
            }
        }
        return null;
    }

    // Find any beneficial route we can claim
    findOpportunisticClaim() {
        const counts = this.player.getCardCounts();

        // Find routes we can claim with current cards
        for (const route of MAP_DATA.routes) {
            // Skip if claimed
            if (this.gameState.claimedRoutes.some(cr => cr.routeId === route.id)) {
                continue;
            }

            // Skip if we don't have enough trains
            if (this.player.trainsRemaining < route.length) {
                continue;
            }

            // Check if connects to our network
            const connectsToNetwork = this.player.claimedRoutes.length === 0 ||
                this.player.claimedRoutes.some(cr =>
                    cr.route.cities.includes(route.cities[0]) ||
                    cr.route.cities.includes(route.cities[1])
                );

            if (connectsToNetwork) {
                const combinations = this.player.getValidCombinations(route);
                if (combinations.length > 0) {
                    // Prefer longer routes (more points per card)
                    if (route.length >= 3) {
                        return {
                            route: route,
                            cards: this.selectBestCombination(combinations)
                        };
                    }
                }
            }
        }

        return null;
    }

    // Select the best card combination (minimize locomotive usage)
    selectBestCombination(combinations) {
        // Sort by locomotive usage (prefer using fewer locomotives)
        combinations.sort((a, b) => a.locomotiveCount - b.locomotiveCount);
        return combinations[0];
    }

    // Decide whether to draw cards
    shouldDrawCards() {
        const totalCards = this.player.getTotalCards();

        // Always draw if we have few cards
        if (totalCards < 4) return true;

        // Check if we have enough for any planned route
        let hasEnoughForSomething = false;
        for (const route of this.plannedPath) {
            if (this.player.claimedRoutes.some(cr => cr.route.id === route.id)) continue;
            if (this.gameState.claimedRoutes.some(cr => cr.routeId === route.id)) continue;

            if (this.player.getValidCombinations(route).length > 0) {
                hasEnoughForSomething = true;
                break;
            }
        }

        // Draw more if we can't claim anything planned
        return !hasEnoughForSomething;
    }

    // Decide which card to draw
    decideCardDraw() {
        const faceUp = this.gameState.cardDeck.faceUpCards;

        // Check if any face-up card matches our target colors
        let bestCard = null;
        let bestPriority = -1;

        for (let i = 0; i < faceUp.length; i++) {
            const card = faceUp[i];
            if (!card) continue;

            let priority = 0;

            if (card === LOCOMOTIVE) {
                // Locomotives are valuable but cost both draws
                priority = 3;
            } else if (this.targetColors[card]) {
                // Cards we need for planned routes
                priority = this.targetColors[card];
            } else {
                // Any colored card is somewhat useful
                priority = 0.5;
            }

            if (priority > bestPriority) {
                bestPriority = priority;
                bestCard = { type: 'faceUp', index: i, card: card };
            }
        }

        // If best option is locomotive and it's worth it, take it
        if (bestCard && bestCard.card === LOCOMOTIVE && bestPriority >= 3) {
            return { type: 'draw', source: 'faceUp', index: bestCard.index };
        }

        // Otherwise prefer face-up colored cards or deck
        if (bestCard && bestCard.card !== LOCOMOTIVE && bestPriority >= 1) {
            return { type: 'draw', source: 'faceUp', index: bestCard.index };
        }

        // Draw from deck (mystery is fine)
        return { type: 'draw', source: 'deck' };
    }

    // Decide whether to draw new destination tickets
    shouldDrawDestinations() {
        // Only if we're doing well on current tickets
        const statuses = this.player.getAllTicketStatuses();
        const completed = statuses.filter(s => s.completed).length;
        const total = statuses.length;

        // Draw more if we've completed most tickets
        if (completed >= total - 1 && this.player.trainsRemaining > 20) {
            return true;
        }

        return false;
    }

    // Choose which destination tickets to keep (when drawing new ones)
    chooseDestinationsToKeep(tickets, minKeep = 1) {
        // Evaluate each ticket
        const evaluated = tickets.map(ticket => {
            const path = this.findBestPath(ticket.city1, ticket.city2);
            const feasible = path !== null;
            const effort = path ? path.reduce((sum, r) => sum + r.length, 0) : Infinity;
            const ratio = feasible ? ticket.points / effort : 0;

            return {
                ticket: ticket,
                feasible: feasible,
                effort: effort,
                ratio: ratio
            };
        });

        // Sort by feasibility and points-to-effort ratio
        evaluated.sort((a, b) => {
            if (a.feasible !== b.feasible) return b.feasible - a.feasible;
            return b.ratio - a.ratio;
        });

        // Keep the best ones (at least minKeep)
        const toKeep = [];
        for (let i = 0; i < evaluated.length && (i < minKeep || evaluated[i].ratio > 0.5); i++) {
            if (evaluated[i].feasible || toKeep.length < minKeep) {
                toKeep.push(evaluated[i].ticket);
            }
        }

        // Ensure we keep at least minKeep
        while (toKeep.length < minKeep && toKeep.length < tickets.length) {
            const next = evaluated.find(e => !toKeep.includes(e.ticket));
            if (next) toKeep.push(next.ticket);
        }

        return toKeep;
    }
}

// AI turn delay for better UX (milliseconds)
const AI_TURN_DELAY = 1000;
const AI_ACTION_DELAY = 500;

// Execute AI turn with delays for visual feedback
async function executeAITurn(player, gameState, callbacks) {
    const ai = new AIPlayer(player, gameState);

    // Add delay before AI acts
    await delay(AI_TURN_DELAY);

    const action = ai.decideAction();

    switch (action.type) {
        case 'claim':
            callbacks.onClaimRoute(action.route, action.cards);
            break;

        case 'draw':
            if (action.source === 'faceUp') {
                callbacks.onDrawFaceUp(action.index);
                await delay(AI_ACTION_DELAY);
                // Second draw if not locomotive
                if (gameState.cardDeck.faceUpCards[action.index] !== LOCOMOTIVE) {
                    const secondAction = ai.decideCardDraw();
                    if (secondAction.source === 'faceUp') {
                        callbacks.onDrawFaceUp(secondAction.index);
                    } else {
                        callbacks.onDrawDeck();
                    }
                }
            } else {
                callbacks.onDrawDeck();
                await delay(AI_ACTION_DELAY);
                callbacks.onDrawDeck();
            }
            break;

        case 'destinations':
            callbacks.onDrawDestinations();
            break;
    }
}

// Helper delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIPlayer, executeAITurn, AI_TURN_DELAY, AI_ACTION_DELAY };
}
