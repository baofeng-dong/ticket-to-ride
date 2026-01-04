// Ticket to Ride - UI Rendering System

class GameUI {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.selectedRoute = null;
        this.hoveredRoute = null;
        this.selectedCards = [];
        this.gameLog = [];

        // Canvas dimensions
        this.width = 0;
        this.height = 0;

        // Bind methods
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleCanvasMove = this.handleCanvasMove.bind(this);
    }

    // Initialize the UI
    initialize() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.canvas.addEventListener('mousemove', this.handleCanvasMove);

        // UI button listeners
        document.getElementById('game-log-toggle').addEventListener('click', () => this.toggleGameLog());
        document.getElementById('close-log').addEventListener('click', () => this.toggleGameLog());
    }

    // Resize canvas to fit container
    resizeCanvas() {
        const container = document.getElementById('board-area');

        // Get container dimensions
        const containerWidth = container.clientWidth - 16;
        const containerHeight = container.clientHeight - 16;

        // USA map aspect ratio is approximately 1.6:1 (wider than tall)
        const targetAspect = 1.6;

        let canvasWidth, canvasHeight;

        // Fit canvas while maintaining aspect ratio
        if (containerWidth / containerHeight > targetAspect) {
            // Container is wider than target - fit to height
            canvasHeight = containerHeight;
            canvasWidth = canvasHeight * targetAspect;
        } else {
            // Container is taller than target - fit to width
            canvasWidth = containerWidth;
            canvasHeight = canvasWidth / targetAspect;
        }

        this.width = Math.floor(canvasWidth);
        this.height = Math.floor(canvasHeight);
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Center canvas in container
        this.canvas.style.maxWidth = this.width + 'px';
        this.canvas.style.maxHeight = this.height + 'px';

        if (typeof game !== 'undefined') {
            this.render();
        }
    }

    // Main render function
    render() {
        this.clearCanvas();
        this.drawBackground();
        this.drawRoutes();
        this.drawCities();
        this.updateScoreboard();
        this.updatePlayerHand();
        this.updateFaceUpCards();
        this.updateGameInfo();
    }

    // Clear the canvas
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // Draw background
    drawBackground() {
        // Gradient background for map
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width
        );
        gradient.addColorStop(0, '#3d5a4a');
        gradient.addColorStop(1, '#2d4a3e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Convert percentage coordinates to canvas pixels
    toCanvasCoords(x, y) {
        return {
            x: (x / 100) * this.width,
            y: (y / 100) * this.height
        };
    }

    // Draw all routes
    drawRoutes() {
        for (const route of MAP_DATA.routes) {
            this.drawRoute(route);
        }
    }

    // Draw a single route
    drawRoute(route) {
        const city1 = MAP_DATA.cities[route.cities[0]];
        const city2 = MAP_DATA.cities[route.cities[1]];

        const start = this.toCanvasCoords(city1.x, city1.y);
        const end = this.toCanvasCoords(city2.x, city2.y);

        // Check if route is claimed
        const claimed = game?.claimedRoutes.find(cr => cr.routeId === route.id);

        // Offset for parallel routes
        let offset = { x: 0, y: 0 };
        if (route.parallel) {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len * 6;
            const ny = dx / len * 6;
            offset = { x: nx, y: ny };
        }

        // Draw route line
        this.ctx.beginPath();
        this.ctx.moveTo(start.x + offset.x, start.y + offset.y);
        this.ctx.lineTo(end.x + offset.x, end.y + offset.y);

        if (claimed) {
            // Claimed route - use player color
            const player = game.playerManager.getPlayer(claimed.playerId);
            this.ctx.strokeStyle = this.getPlayerColor(player.color);
            this.ctx.lineWidth = 8;
        } else {
            // Unclaimed route - use route color
            this.ctx.strokeStyle = MAP_DATA.colors[route.color] || '#666';
            this.ctx.lineWidth = 4;

            // Highlight if hovered
            if (this.hoveredRoute && this.hoveredRoute.id === route.id) {
                this.ctx.lineWidth = 6;
                this.ctx.shadowColor = '#fff';
                this.ctx.shadowBlur = 10;
            }

            // Highlight if selected
            if (this.selectedRoute && this.selectedRoute.id === route.id) {
                this.ctx.strokeStyle = '#e94560';
                this.ctx.lineWidth = 8;
            }
        }

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw route segments (train cars)
        this.drawRouteSegments(route, start, end, offset, claimed);
    }

    // Draw the train car segments on a route
    drawRouteSegments(route, start, end, offset, claimed) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const segmentLen = len / route.length;

        for (let i = 0; i < route.length; i++) {
            const t1 = (i + 0.1) / route.length;
            const t2 = (i + 0.9) / route.length;

            const x1 = start.x + dx * t1 + offset.x;
            const y1 = start.y + dy * t1 + offset.y;
            const x2 = start.x + dx * t2 + offset.x;
            const y2 = start.y + dy * t2 + offset.y;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);

            if (claimed) {
                const player = game.playerManager.getPlayer(claimed.playerId);
                this.ctx.strokeStyle = this.getPlayerColor(player.color);
                this.ctx.lineWidth = 10;
            } else {
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.lineWidth = 3;
            }
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }

        // Draw route length indicator
        if (!claimed) {
            const midX = (start.x + end.x) / 2 + offset.x;
            const midY = (start.y + end.y) / 2 + offset.y;

            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 10, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(route.length, midX, midY);
        }
    }

    // Draw all cities
    drawCities() {
        for (const [name, city] of Object.entries(MAP_DATA.cities)) {
            this.drawCity(name, city);
        }
    }

    // Draw a single city
    drawCity(name, city) {
        const pos = this.toCanvasCoords(city.x, city.y);

        // City dot
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // City name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(name, pos.x, pos.y - 10);
    }

    // Get player color for rendering
    getPlayerColor(color) {
        const colors = {
            'red': '#c0392b',
            'blue': '#2980b9',
            'green': '#27ae60',
            'yellow': '#f39c12',
            'black': '#2c3e50'
        };
        return colors[color] || '#666';
    }

    // Handle canvas click
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicked on a route
        const route = this.findRouteAtPosition(x, y);
        if (route && game.currentAction === 'claim') {
            this.selectRoute(route);
        }
    }

    // Handle canvas mouse move
    handleCanvasMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const route = this.findRouteAtPosition(x, y);
        if (route !== this.hoveredRoute) {
            this.hoveredRoute = route;
            this.render();
        }

        // Change cursor
        this.canvas.style.cursor = route ? 'pointer' : 'default';
    }

    // Find route at mouse position
    findRouteAtPosition(x, y) {
        for (const route of MAP_DATA.routes) {
            // Skip claimed routes
            if (game?.claimedRoutes.some(cr => cr.routeId === route.id)) {
                continue;
            }

            const city1 = MAP_DATA.cities[route.cities[0]];
            const city2 = MAP_DATA.cities[route.cities[1]];

            const start = this.toCanvasCoords(city1.x, city1.y);
            const end = this.toCanvasCoords(city2.x, city2.y);

            // Calculate distance from point to line
            const dist = this.pointToLineDistance(x, y, start.x, start.y, end.x, end.y);
            if (dist < 15) {
                return route;
            }
        }
        return null;
    }

    // Calculate distance from point to line segment
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = dx * dx + dy * dy;

        if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
    }

    // Select a route for claiming
    selectRoute(route) {
        this.selectedRoute = route;
        this.render();
        game.showRouteClaimModal(route);
    }

    // Clear route selection
    clearRouteSelection() {
        this.selectedRoute = null;
        this.render();
    }

    // Update scoreboard
    updateScoreboard() {
        const container = document.getElementById('player-scores');
        container.innerHTML = '';

        if (!game?.playerManager) return;

        for (const player of game.playerManager.getAllPlayers()) {
            const isCurrentTurn = game.playerManager.getCurrentPlayer().id === player.id;

            const item = document.createElement('div');
            item.className = `player-score-item player-color-${player.color}${isCurrentTurn ? ' current-turn' : ''}`;

            const score = player.routePoints;
            const cardCount = player.getTotalCards();

            item.innerHTML = `
                <div class="player-name">${player.name}${player.isAI ? ' (AI)' : ''}</div>
                <div class="player-stats">
                    <span>Score: ${score}</span>
                    <span>Trains: ${player.trainsRemaining}</span>
                    <span>Cards: ${cardCount}</span>
                    <span>Tickets: ${player.destinationTickets.length}</span>
                </div>
            `;

            container.appendChild(item);
        }
    }

    // Update player's hand display
    updatePlayerHand() {
        const container = document.getElementById('hand-cards');
        container.innerHTML = '';

        if (!game?.playerManager) return;

        const player = game.playerManager.getCurrentPlayer();
        if (player.isAI) {
            container.innerHTML = '<p style="color: var(--text-secondary)">AI is thinking...</p>';
            return;
        }

        const counts = player.getCardCounts();

        for (const color of [...CARD_COLORS, LOCOMOTIVE]) {
            if (counts[color] > 0) {
                const group = document.createElement('div');
                group.className = 'hand-card-group';

                const card = document.createElement('div');
                card.className = `hand-card card-${color}`;
                card.textContent = color === LOCOMOTIVE ? 'WILD' : color.charAt(0).toUpperCase();
                card.dataset.color = color;

                const count = document.createElement('span');
                count.className = 'hand-card-count';
                count.textContent = `x${counts[color]}`;

                group.appendChild(card);
                group.appendChild(count);
                container.appendChild(group);
            }
        }

        // Update destination tickets
        this.updateDestinationTickets(player);

        // Update trains remaining
        document.getElementById('trains-remaining').textContent = `Trains: ${player.trainsRemaining}`;
        document.getElementById('player-name-display').textContent = `${player.name}'s Hand`;
    }

    // Update destination tickets display
    updateDestinationTickets(player) {
        const container = document.getElementById('ticket-list');
        container.innerHTML = '';

        for (const ticket of player.destinationTickets) {
            const completed = player.hasConnectedCities(ticket.city1, ticket.city2);

            const ticketEl = document.createElement('div');
            ticketEl.className = `ticket-card${completed ? ' completed' : ''}`;

            ticketEl.innerHTML = `
                <div class="ticket-cities">${ticket.city1} → ${ticket.city2}</div>
                <div class="ticket-points">${completed ? '+' : ''}${ticket.points} pts</div>
            `;

            container.appendChild(ticketEl);
        }
    }

    // Update face-up cards display
    updateFaceUpCards() {
        const container = document.getElementById('face-up-card-slots');
        container.innerHTML = '';

        if (!game?.cardDeck) return;

        for (let i = 0; i < 5; i++) {
            const card = game.cardDeck.faceUpCards[i];
            const cardEl = document.createElement('div');
            cardEl.className = `face-up-card${card ? ` card-${card}` : ''}`;
            cardEl.dataset.index = i;

            if (card) {
                cardEl.textContent = card === LOCOMOTIVE ? 'WILD' : card.toUpperCase();
                cardEl.addEventListener('click', () => game.handleFaceUpCardClick(i));
            }

            container.appendChild(cardEl);
        }

        // Update deck count
        document.getElementById('deck-count').textContent = `Deck: ${game.cardDeck.getTrainDeckCount()}`;

        // Deck click handler
        document.getElementById('train-deck').onclick = () => game.handleDeckClick();
    }

    // Update game info display
    updateGameInfo() {
        if (!game?.playerManager) return;

        const currentPlayer = game.playerManager.getCurrentPlayer();
        document.getElementById('current-player-display').textContent =
            `Current: ${currentPlayer.name}${currentPlayer.isAI ? ' (AI)' : ''}`;

        let phaseText = game.phase;
        if (game.phase === 'lastRound') {
            phaseText = `FINAL ROUND (${game.turnsRemainingAfterTrigger} turns left)`;
        }
        document.getElementById('game-phase-display').textContent =
            `Phase: ${phaseText}`;
    }

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Toggle game log panel
    toggleGameLog() {
        const panel = document.getElementById('game-log-panel');
        panel.classList.toggle('hidden');
    }

    // Add entry to game log
    addLogEntry(message, type = 'info') {
        const time = new Date().toLocaleTimeString();
        this.gameLog.push({ message, type, time });

        const container = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry action-${type}`;
        entry.innerHTML = `${message} <span class="log-time">${time}</span>`;
        container.insertBefore(entry, container.firstChild);
    }

    // Show destination ticket selection modal
    showDestinationModal(tickets, minKeep, callback) {
        const modal = document.getElementById('destination-modal');
        const choices = document.getElementById('destination-choices');
        const confirmBtn = document.getElementById('confirm-destinations');
        document.getElementById('min-keep').textContent = minKeep;

        choices.innerHTML = '';
        const selected = new Set();

        tickets.forEach((ticket, index) => {
            const choice = document.createElement('div');
            choice.className = 'destination-choice';
            choice.innerHTML = `
                <input type="checkbox" id="dest-${index}" value="${index}">
                <div class="destination-choice-info">
                    <div class="destination-choice-cities">${ticket.city1} → ${ticket.city2}</div>
                    <div class="destination-choice-points">${ticket.points} points</div>
                </div>
            `;

            choice.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = choice.querySelector('input');
                    checkbox.checked = !checkbox.checked;
                }

                const checkbox = choice.querySelector('input');
                if (checkbox.checked) {
                    selected.add(index);
                    choice.classList.add('selected');
                } else {
                    selected.delete(index);
                    choice.classList.remove('selected');
                }

                confirmBtn.disabled = selected.size < minKeep;
            });

            choices.appendChild(choice);
        });

        confirmBtn.disabled = true;
        confirmBtn.onclick = () => {
            const kept = tickets.filter((_, i) => selected.has(i));
            const returned = tickets.filter((_, i) => !selected.has(i));
            modal.classList.add('hidden');
            callback(kept, returned);
        };

        modal.classList.remove('hidden');
    }

    // Show route claim modal
    showRouteClaimModal(route, combinations, callback) {
        const modal = document.getElementById('route-modal');
        const details = document.getElementById('route-details');
        const cardSelection = document.getElementById('card-selection');
        const confirmBtn = document.getElementById('confirm-route');
        const cancelBtn = document.getElementById('cancel-route');

        details.innerHTML = `
            <div class="route-info-line"><strong>Route:</strong> ${route.cities[0]} → ${route.cities[1]}</div>
            <div class="route-info-line"><strong>Length:</strong> ${route.length} trains</div>
            <div class="route-info-line"><strong>Color:</strong> ${route.color}</div>
            <div class="route-info-line"><strong>Points:</strong> ${MAP_DATA.routeScoring[route.length]}</div>
        `;

        cardSelection.innerHTML = '<h4>Select cards to use:</h4>';

        let selectedCombination = null;

        combinations.forEach((combo, index) => {
            const option = document.createElement('div');
            option.className = 'card-select-group';
            option.innerHTML = `
                <input type="radio" name="card-combo" value="${index}" id="combo-${index}">
                <div class="card-select-color card-${combo.color}" style="width:40px;height:40px;border-radius:6px;"></div>
                <div class="card-select-count">
                    ${combo.colorCount} ${combo.color}${combo.locomotiveCount > 0 ? ` + ${combo.locomotiveCount} wild` : ''}
                </div>
            `;

            option.addEventListener('click', () => {
                document.querySelectorAll('.card-select-group').forEach(g => g.classList.remove('selected'));
                option.classList.add('selected');
                option.querySelector('input').checked = true;
                selectedCombination = combo;
                confirmBtn.disabled = false;
            });

            cardSelection.appendChild(option);
        });

        confirmBtn.disabled = true;
        confirmBtn.onclick = () => {
            if (selectedCombination) {
                modal.classList.add('hidden');
                this.clearRouteSelection();
                callback(selectedCombination);
            }
        };

        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
            this.clearRouteSelection();
        };

        modal.classList.remove('hidden');
    }

    // Show game over modal
    showGameOverModal(scores) {
        const modal = document.getElementById('gameover-modal');
        const scoresContainer = document.getElementById('final-scores');
        const winnerAnnouncement = document.getElementById('winner-announcement');

        scoresContainer.innerHTML = '';

        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = `final-score-item player-color-${score.player.color}${index === 0 ? ' winner' : ''}`;

            item.innerHTML = `
                <div>
                    <div class="final-score-name">${index + 1}. ${score.player.name}</div>
                    <div class="final-score-breakdown">
                        Routes: ${score.routePoints} |
                        Tickets: ${score.ticketPoints > 0 ? '+' : ''}${score.ticketPoints} |
                        ${score.hasLongestRoute ? `Longest Route: +${score.longestRouteBonus}` : ''}
                    </div>
                </div>
                <div class="final-score-total">${score.totalScore}</div>
            `;

            scoresContainer.appendChild(item);
        });

        const winner = scores[0];
        winnerAnnouncement.innerHTML = `<strong>${winner.player.name}</strong> wins!`;

        document.getElementById('play-again').onclick = () => {
            modal.classList.add('hidden');
            game.resetGame();
        };

        modal.classList.remove('hidden');
    }

    // Update action buttons state
    updateActionButtons(canDraw, canClaim, canDestinations) {
        document.getElementById('btn-draw-cards').disabled = !canDraw;
        document.getElementById('btn-claim-route').disabled = !canClaim;
        document.getElementById('btn-draw-destinations').disabled = !canDestinations;
    }

    // Set action message
    setActionMessage(message) {
        document.getElementById('action-message').textContent = message;
    }

    // Highlight active action
    setActiveAction(action) {
        document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('active'));
        if (action) {
            const btn = document.getElementById(`btn-${action}`);
            if (btn) btn.classList.add('active');
        }
    }
}

// Create global UI instance
const ui = new GameUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameUI, ui };
}
