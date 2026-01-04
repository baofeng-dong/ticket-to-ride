// Ticket to Ride - Core Game Logic

class Game {
    constructor() {
        this.playerManager = new PlayerManager();
        this.cardDeck = new CardDeck();
        this.claimedRoutes = [];

        this.phase = 'setup'; // setup, playing, lastRound, ended
        this.currentAction = null; // null, 'draw', 'claim', 'destinations'
        this.cardsDrawnThisTurn = 0;
        this.lastRoundTriggeredBy = null;
        this.turnsRemainingAfterTrigger = 0;

        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Setup screen
        document.getElementById('num-players').addEventListener('change', () => this.updatePlayerConfig());
        document.getElementById('start-game').addEventListener('click', () => this.startGame());

        // Action buttons
        document.getElementById('btn-draw-cards').addEventListener('click', () => this.startDrawCards());
        document.getElementById('btn-claim-route').addEventListener('click', () => this.startClaimRoute());
        document.getElementById('btn-draw-destinations').addEventListener('click', () => this.startDrawDestinations());
    }

    // Initialize setup screen
    initializeSetup() {
        this.updatePlayerConfig();
    }

    // Update player configuration UI
    updatePlayerConfig() {
        const numPlayers = parseInt(document.getElementById('num-players').value);
        const container = document.getElementById('player-config');
        container.innerHTML = '';

        const colors = ['red', 'blue', 'green', 'yellow', 'black'];
        const defaultNames = ['You', 'AI Player 2', 'AI Player 3', 'AI Player 4', 'AI Player 5'];

        for (let i = 0; i < numPlayers; i++) {
            const div = document.createElement('div');
            div.className = 'player-config-item';
            div.innerHTML = `
                <div class="player-color" style="background: ${this.getPlayerColorHex(colors[i])}"></div>
                <input type="text" id="player-name-${i}" value="${defaultNames[i]}" placeholder="Player ${i + 1}">
                <select id="player-type-${i}">
                    <option value="human" ${i === 0 ? 'selected' : ''}>Human</option>
                    <option value="ai" ${i > 0 ? 'selected' : ''}>AI</option>
                </select>
            `;
            container.appendChild(div);
        }
    }

    // Get player color hex value
    getPlayerColorHex(color) {
        const colors = {
            'red': '#c0392b',
            'blue': '#2980b9',
            'green': '#27ae60',
            'yellow': '#f39c12',
            'black': '#2c3e50'
        };
        return colors[color] || '#666';
    }

    // Start the game
    startGame() {
        const numPlayers = parseInt(document.getElementById('num-players').value);
        const colors = ['red', 'blue', 'green', 'yellow', 'black'];

        // Create players
        for (let i = 0; i < numPlayers; i++) {
            const name = document.getElementById(`player-name-${i}`).value || `Player ${i + 1}`;
            const isAI = document.getElementById(`player-type-${i}`).value === 'ai';
            this.playerManager.addPlayer(name, colors[i], isAI);
        }

        // Initialize decks
        this.cardDeck.initialize();

        // Deal initial cards
        for (const player of this.playerManager.getAllPlayers()) {
            const cards = [];
            for (let i = 0; i < INITIAL_CARDS; i++) {
                cards.push(this.cardDeck.drawTrainCard());
            }
            player.addTrainCards(cards);
        }

        // Switch to game screen
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        // Initialize UI
        ui.initialize();

        // Start initial destination ticket phase
        this.phase = 'initial-destinations';
        this.dealInitialDestinations();
    }

    // Deal initial destination tickets to all players
    async dealInitialDestinations() {
        for (const player of this.playerManager.getAllPlayers()) {
            const tickets = this.cardDeck.drawDestinationTickets(3);

            if (player.isAI) {
                // AI chooses tickets
                const ai = new AIPlayer(player, this);
                const kept = ai.chooseDestinationsToKeep(tickets, 2);
                const returned = tickets.filter(t => !kept.includes(t));
                player.addDestinationTickets(kept);
                this.cardDeck.returnDestinationTickets(returned);
                ui.addLogEntry(`${player.name} kept ${kept.length} destination tickets`, 'destination');
            } else {
                // Human chooses tickets
                await new Promise(resolve => {
                    ui.showDestinationModal(tickets, 2, (kept, returned) => {
                        player.addDestinationTickets(kept);
                        this.cardDeck.returnDestinationTickets(returned);
                        ui.addLogEntry(`${player.name} kept ${kept.length} destination tickets`, 'destination');
                        resolve();
                    });
                });
            }
        }

        // Start playing phase
        this.phase = 'playing';
        ui.render();
        this.startTurn();
    }

    // Start a player's turn
    async startTurn() {
        const player = this.playerManager.getCurrentPlayer();
        this.currentAction = null;
        this.cardsDrawnThisTurn = 0;

        ui.render();
        ui.updateActionButtons(true, true, this.cardDeck.getDestinationDeckCount() > 0);
        ui.setActionMessage(`${player.name}'s turn - choose an action`);
        ui.setActiveAction(null);

        if (player.isAI) {
            await this.executeAITurn(player);
        } else {
            // Notify human player it's their turn
            ui.showToast(`Your turn, ${player.name}!`, 'info', 2000);
        }
    }

    // Execute AI turn - simplified and reliable
    async executeAITurn(player) {
        ui.setActionMessage(`${player.name} is thinking...`);

        // Small delay before AI acts
        await this.delay(800);

        const ai = new AIPlayer(player, this);
        const action = ai.decideAction();

        try {
            switch (action.type) {
                case 'claim':
                    await this.aiClaimRoute(player, action.route, action.cards);
                    break;

                case 'draw':
                    await this.aiDrawCards(player, ai, action);
                    break;

                case 'destinations':
                    await this.aiDrawDestinations(player, ai);
                    break;

                default:
                    // Fallback: just draw from deck
                    await this.aiDrawCards(player, ai, { source: 'deck' });
            }
        } catch (error) {
            console.error('AI turn error:', error);
            // Fallback: end turn to prevent getting stuck
            this.endTurn();
        }
    }

    // AI claims a route
    async aiClaimRoute(player, route, cards) {
        // Remove cards from hand
        const removed = [];
        removed.push(...player.removeTrainCards(cards.color, cards.colorCount));
        removed.push(...player.removeTrainCards(LOCOMOTIVE, cards.locomotiveCount));

        // Claim the route
        player.claimRoute(route, removed);
        this.claimedRoutes.push({ routeId: route.id, playerId: player.id });

        // Discard used cards
        this.cardDeck.discardCards(removed);

        ui.addLogEntry(`${player.name} claimed ${route.cities[0]} → ${route.cities[1]}`, 'claim');
        ui.render();

        this.checkEndGame(player);
        this.endTurn();
    }

    // AI draws cards (handles both face-up and deck draws)
    async aiDrawCards(player, ai, firstAction) {
        let cardsDrawn = 0;

        // First draw
        if (firstAction.source === 'faceUp') {
            const isLocomotive = this.cardDeck.isFaceUpLocomotive(firstAction.index);
            const card = this.cardDeck.drawFaceUpCard(firstAction.index);
            if (card) {
                player.addTrainCards([card]);
                ui.addLogEntry(`${player.name} drew a ${card} card`, 'draw');
                ui.render();
                cardsDrawn++;

                // Locomotive counts as 2 draws
                if (isLocomotive) {
                    cardsDrawn = 2;
                }
            }
        } else {
            const card = this.cardDeck.drawTrainCard();
            if (card) {
                player.addTrainCards([card]);
                ui.addLogEntry(`${player.name} drew from deck`, 'draw');
                ui.render();
                cardsDrawn++;
            }
        }

        // Second draw if needed
        if (cardsDrawn < 2) {
            await this.delay(400);

            const secondAction = ai.decideCardDraw();
            if (secondAction.source === 'faceUp') {
                // Can't take locomotive as second draw
                if (!this.cardDeck.isFaceUpLocomotive(secondAction.index)) {
                    const card = this.cardDeck.drawFaceUpCard(secondAction.index);
                    if (card) {
                        player.addTrainCards([card]);
                        ui.addLogEntry(`${player.name} drew a ${card} card`, 'draw');
                        ui.render();
                    }
                } else {
                    // Take from deck instead
                    const card = this.cardDeck.drawTrainCard();
                    if (card) {
                        player.addTrainCards([card]);
                        ui.addLogEntry(`${player.name} drew from deck`, 'draw');
                        ui.render();
                    }
                }
            } else {
                const card = this.cardDeck.drawTrainCard();
                if (card) {
                    player.addTrainCards([card]);
                    ui.addLogEntry(`${player.name} drew from deck`, 'draw');
                    ui.render();
                }
            }
        }

        // End turn after drawing
        this.endTurn();
    }

    // AI draws destinations
    async aiDrawDestinations(player, ai) {
        const tickets = this.cardDeck.drawDestinationTickets(3);

        if (tickets.length === 0) {
            // No tickets left, draw cards instead
            await this.aiDrawCards(player, ai, { source: 'deck' });
            return;
        }

        const kept = ai.chooseDestinationsToKeep(tickets, 1);
        const returned = tickets.filter(t => !kept.includes(t));

        player.addDestinationTickets(kept);
        this.cardDeck.returnDestinationTickets(returned);

        ui.addLogEntry(`${player.name} drew ${kept.length} destination tickets`, 'destination');
        ui.render();

        this.endTurn();
    }

    // Helper delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Start draw cards action
    startDrawCards() {
        const player = this.playerManager.getCurrentPlayer();
        if (player.isAI) return;

        this.currentAction = 'draw';
        ui.setActiveAction('draw-cards');
        ui.setActionMessage('Click a face-up card or the deck to draw');
        ui.updateActionButtons(false, false, false);
    }

    // Handle face-up card click
    handleFaceUpCardClick(index) {
        const player = this.playerManager.getCurrentPlayer();
        if (player.isAI) return;

        if (this.currentAction !== 'draw' && this.cardsDrawnThisTurn === 0) {
            this.startDrawCards();
        }

        if (this.currentAction === 'draw') {
            const isLocomotive = this.cardDeck.isFaceUpLocomotive(index);

            // Can't take locomotive as second draw
            if (this.cardsDrawnThisTurn === 1 && isLocomotive) {
                ui.setActionMessage("Can't take locomotive as second draw!");
                return;
            }

            const card = this.cardDeck.drawFaceUpCard(index);
            if (card) {
                player.addTrainCards([card]);
                this.cardsDrawnThisTurn++;

                ui.addLogEntry(`${player.name} drew a ${card} card`, 'draw');
                ui.render();

                // Locomotive counts as 2 draws
                if (isLocomotive || this.cardsDrawnThisTurn >= 2) {
                    this.endTurn();
                } else {
                    ui.setActionMessage('Draw one more card (no locomotives from face-up)');
                }
            }
        }
    }

    // Handle deck click
    handleDeckClick() {
        const player = this.playerManager.getCurrentPlayer();
        if (player.isAI) return;

        if (this.currentAction !== 'draw' && this.cardsDrawnThisTurn === 0) {
            this.startDrawCards();
        }

        if (this.currentAction === 'draw') {
            const card = this.cardDeck.drawTrainCard();
            if (card) {
                player.addTrainCards([card]);
                this.cardsDrawnThisTurn++;

                ui.addLogEntry(`${player.name} drew from deck`, 'draw');
                ui.render();

                if (this.cardsDrawnThisTurn >= 2) {
                    this.endTurn();
                } else {
                    ui.setActionMessage('Draw one more card');
                }
            }
        }
    }

    // Start claim route action
    startClaimRoute() {
        const player = this.playerManager.getCurrentPlayer();
        if (player.isAI) return;

        this.currentAction = 'claim';
        ui.setActiveAction('claim-route');
        ui.setActionMessage('Click on a route to claim it');
        ui.updateActionButtons(false, false, false);
    }

    // Show route claim modal (called from UI)
    showRouteClaimModal(route) {
        const player = this.playerManager.getCurrentPlayer();

        // Check if route is already claimed
        if (this.claimedRoutes.some(cr => cr.routeId === route.id)) {
            ui.setActionMessage('This route is already claimed!');
            ui.clearRouteSelection();
            return;
        }

        // Check if player has enough trains
        if (player.trainsRemaining < route.length) {
            ui.setActionMessage('Not enough trains!');
            ui.clearRouteSelection();
            return;
        }

        // Get valid card combinations
        const combinations = player.getValidCombinations(route);

        if (combinations.length === 0) {
            ui.setActionMessage('Not enough cards to claim this route!');
            ui.clearRouteSelection();
            return;
        }

        // Show modal for card selection
        ui.showRouteClaimModal(route, combinations, (selectedCards) => {
            this.claimRoute(route, selectedCards);
        });
    }

    // Claim a route
    claimRoute(route, cards) {
        const player = this.playerManager.getCurrentPlayer();

        // Remove cards from hand
        const removed = [];
        removed.push(...player.removeTrainCards(cards.color, cards.colorCount));
        removed.push(...player.removeTrainCards(LOCOMOTIVE, cards.locomotiveCount));

        // Claim the route
        player.claimRoute(route, removed);
        this.claimedRoutes.push({ routeId: route.id, playerId: player.id });

        // Discard used cards
        this.cardDeck.discardCards(removed);

        ui.addLogEntry(`${player.name} claimed ${route.cities[0]} → ${route.cities[1]} for ${MAP_DATA.routeScoring[route.length]} points`, 'claim');
        ui.render();

        this.checkEndGame(player);
        this.endTurn();
    }

    // Start draw destinations action
    startDrawDestinations() {
        const player = this.playerManager.getCurrentPlayer();
        if (player.isAI) return;

        if (this.cardDeck.getDestinationDeckCount() === 0) {
            ui.setActionMessage('No destination tickets left!');
            return;
        }

        const tickets = this.cardDeck.drawDestinationTickets(3);

        ui.showDestinationModal(tickets, 1, (kept, returned) => {
            player.addDestinationTickets(kept);
            this.cardDeck.returnDestinationTickets(returned);

            ui.addLogEntry(`${player.name} drew ${kept.length} destination tickets`, 'destination');
            ui.render();

            this.endTurn();
        });
    }

    // Check if end game is triggered
    checkEndGame(player) {
        if (this.phase === 'lastRound') return;

        if (player.trainsRemaining <= 2) {
            this.phase = 'lastRound';
            this.lastRoundTriggeredBy = player.id;
            this.turnsRemainingAfterTrigger = this.playerManager.getPlayerCount();

            ui.addLogEntry(`${player.name} has 2 or fewer trains - Final round begins!`, 'info');
            ui.showToast(`FINAL ROUND! ${player.name} triggered the end game!`, 'warning', 4000);
        }
    }

    // End current turn
    async endTurn() {
        this.currentAction = null;
        this.cardsDrawnThisTurn = 0;

        // Check if game is over
        if (this.phase === 'lastRound') {
            this.turnsRemainingAfterTrigger--;
            if (this.turnsRemainingAfterTrigger <= 0) {
                this.endGame();
                return;
            }
        }

        // Move to next player
        this.playerManager.nextPlayer();

        // Small delay before next turn
        await new Promise(resolve => setTimeout(resolve, 500));

        this.startTurn();
    }

    // End the game and show results
    endGame() {
        this.phase = 'ended';

        const scores = calculateFinalScores(this.playerManager.getAllPlayers());

        ui.addLogEntry('Game Over!', 'info');
        ui.showGameOverModal(scores);
    }

    // Reset and start new game
    resetGame() {
        this.playerManager.reset();
        this.cardDeck = new CardDeck();
        this.claimedRoutes = [];
        this.phase = 'setup';
        this.currentAction = null;
        this.cardsDrawnThisTurn = 0;
        this.lastRoundTriggeredBy = null;
        this.turnsRemainingAfterTrigger = 0;

        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('setup-screen').classList.remove('hidden');

        this.initializeSetup();
    }
}

// Create global game instance
let game;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    game.initializeSetup();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
