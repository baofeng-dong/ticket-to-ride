// Ticket to Ride - Card System
// Train cards and Destination tickets for USA edition

const CARD_COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'black', 'white'];
const LOCOMOTIVE = 'locomotive';

// Train card deck configuration (110 cards total)
const TRAIN_CARD_COUNTS = {
    'red': 12,
    'orange': 12,
    'yellow': 12,
    'green': 12,
    'blue': 12,
    'purple': 12,
    'black': 12,
    'white': 12,
    'locomotive': 14
};

// All 30 destination tickets for USA edition
const DESTINATION_TICKETS = [
    { id: 1, city1: 'Los Angeles', city2: 'New York', points: 21 },
    { id: 2, city1: 'Duluth', city2: 'Houston', points: 8 },
    { id: 3, city1: 'Sault Ste Marie', city2: 'Nashville', points: 8 },
    { id: 4, city1: 'New York', city2: 'Atlanta', points: 6 },
    { id: 5, city1: 'Portland', city2: 'Nashville', points: 17 },
    { id: 6, city1: 'Vancouver', city2: 'Montreal', points: 20 },
    { id: 7, city1: 'Duluth', city2: 'El Paso', points: 10 },
    { id: 8, city1: 'Toronto', city2: 'Miami', points: 10 },
    { id: 9, city1: 'Portland', city2: 'Phoenix', points: 11 },
    { id: 10, city1: 'Dallas', city2: 'New York', points: 11 },
    { id: 11, city1: 'Calgary', city2: 'Salt Lake City', points: 7 },
    { id: 12, city1: 'Calgary', city2: 'Phoenix', points: 13 },
    { id: 13, city1: 'Los Angeles', city2: 'Miami', points: 20 },
    { id: 14, city1: 'Winnipeg', city2: 'Little Rock', points: 11 },
    { id: 15, city1: 'San Francisco', city2: 'Atlanta', points: 17 },
    { id: 16, city1: 'Kansas City', city2: 'Houston', points: 5 },
    { id: 17, city1: 'Los Angeles', city2: 'Chicago', points: 16 },
    { id: 18, city1: 'Denver', city2: 'Pittsburgh', points: 11 },
    { id: 19, city1: 'Chicago', city2: 'Santa Fe', points: 9 },
    { id: 20, city1: 'Vancouver', city2: 'Santa Fe', points: 13 },
    { id: 21, city1: 'Boston', city2: 'Miami', points: 12 },
    { id: 22, city1: 'Chicago', city2: 'New Orleans', points: 7 },
    { id: 23, city1: 'Montreal', city2: 'Atlanta', points: 9 },
    { id: 24, city1: 'Seattle', city2: 'New York', points: 22 },
    { id: 25, city1: 'Denver', city2: 'El Paso', points: 4 },
    { id: 26, city1: 'Helena', city2: 'Los Angeles', points: 8 },
    { id: 27, city1: 'Winnipeg', city2: 'Houston', points: 12 },
    { id: 28, city1: 'Montreal', city2: 'New Orleans', points: 13 },
    { id: 29, city1: 'Sault Ste Marie', city2: 'Oklahoma City', points: 9 },
    { id: 30, city1: 'Seattle', city2: 'Los Angeles', points: 9 }
];

// Card deck management class
class CardDeck {
    constructor() {
        this.trainDeck = [];
        this.trainDiscard = [];
        this.faceUpCards = [];
        this.destinationDeck = [];
    }

    // Initialize all decks
    initialize() {
        this.createTrainDeck();
        this.createDestinationDeck();
        this.shuffleTrainDeck();
        this.shuffleDestinationDeck();
        this.dealFaceUpCards();
    }

    // Create the initial train card deck
    createTrainDeck() {
        this.trainDeck = [];
        for (const [color, count] of Object.entries(TRAIN_CARD_COUNTS)) {
            for (let i = 0; i < count; i++) {
                this.trainDeck.push(color);
            }
        }
    }

    // Create the destination ticket deck
    createDestinationDeck() {
        this.destinationDeck = [...DESTINATION_TICKETS];
    }

    // Fisher-Yates shuffle for train deck
    shuffleTrainDeck() {
        for (let i = this.trainDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.trainDeck[i], this.trainDeck[j]] = [this.trainDeck[j], this.trainDeck[i]];
        }
    }

    // Shuffle destination deck
    shuffleDestinationDeck() {
        for (let i = this.destinationDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.destinationDeck[i], this.destinationDeck[j]] = [this.destinationDeck[j], this.destinationDeck[i]];
        }
    }

    // Deal 5 face-up cards
    dealFaceUpCards() {
        this.faceUpCards = [];
        for (let i = 0; i < 5; i++) {
            const card = this.drawTrainCard();
            if (card) {
                this.faceUpCards.push(card);
            }
        }
        // Check for too many locomotives (3+)
        this.checkLocomotiveRule();
    }

    // Check if 3+ face-up cards are locomotives (requires redeal)
    checkLocomotiveRule() {
        const locomotiveCount = this.faceUpCards.filter(c => c === LOCOMOTIVE).length;
        if (locomotiveCount >= 3 && this.trainDeck.length > 0) {
            // Discard face-up cards and redeal
            this.faceUpCards.forEach(card => this.trainDiscard.push(card));
            this.faceUpCards = [];
            this.dealFaceUpCards();
        }
    }

    // Draw a card from the train deck
    drawTrainCard() {
        if (this.trainDeck.length === 0) {
            this.reshuffleDiscard();
        }
        return this.trainDeck.pop() || null;
    }

    // Draw a face-up card by index
    drawFaceUpCard(index) {
        if (index < 0 || index >= this.faceUpCards.length) {
            return null;
        }
        const card = this.faceUpCards[index];
        this.faceUpCards[index] = this.drawTrainCard();
        this.checkLocomotiveRule();
        return card;
    }

    // Draw destination tickets (3 at a time)
    drawDestinationTickets(count = 3) {
        const tickets = [];
        for (let i = 0; i < count && this.destinationDeck.length > 0; i++) {
            tickets.push(this.destinationDeck.pop());
        }
        return tickets;
    }

    // Return unselected destination tickets to bottom of deck
    returnDestinationTickets(tickets) {
        this.destinationDeck.unshift(...tickets);
    }

    // Reshuffle discard pile into draw pile
    reshuffleDiscard() {
        if (this.trainDiscard.length === 0) return;
        this.trainDeck = [...this.trainDiscard];
        this.trainDiscard = [];
        this.shuffleTrainDeck();
    }

    // Add cards to discard pile
    discardCards(cards) {
        this.trainDiscard.push(...cards);
    }

    // Get remaining cards in train deck
    getTrainDeckCount() {
        return this.trainDeck.length;
    }

    // Get remaining destination tickets
    getDestinationDeckCount() {
        return this.destinationDeck.length;
    }

    // Check if a face-up card is a locomotive
    isFaceUpLocomotive(index) {
        return this.faceUpCards[index] === LOCOMOTIVE;
    }
}

// Helper function to count cards by color
function countCardsByColor(cards) {
    const counts = {};
    CARD_COLORS.forEach(color => counts[color] = 0);
    counts[LOCOMOTIVE] = 0;

    cards.forEach(card => {
        if (counts.hasOwnProperty(card)) {
            counts[card]++;
        }
    });

    return counts;
}

// Helper function to check if player can claim a route
function canClaimRoute(handCards, routeColor, routeLength) {
    const counts = countCardsByColor(handCards);
    const locomotives = counts[LOCOMOTIVE] || 0;

    if (routeColor === 'gray') {
        // Gray routes can use any single color
        for (const color of CARD_COLORS) {
            if (counts[color] + locomotives >= routeLength) {
                return true;
            }
        }
        return false;
    } else {
        // Colored routes need matching color or locomotives
        return (counts[routeColor] || 0) + locomotives >= routeLength;
    }
}

// Get valid card combinations to claim a route
function getValidCardCombinations(handCounts, routeColor, routeLength) {
    const combinations = [];
    const locomotives = handCounts[LOCOMOTIVE] || 0;

    const colorsToCheck = routeColor === 'gray' ? CARD_COLORS : [routeColor];

    for (const color of colorsToCheck) {
        const colorCount = handCounts[color] || 0;
        const totalAvailable = colorCount + locomotives;

        if (totalAvailable >= routeLength) {
            // Generate all valid combinations of this color + locomotives
            for (let locoUsed = 0; locoUsed <= Math.min(locomotives, routeLength); locoUsed++) {
                const colorNeeded = routeLength - locoUsed;
                if (colorCount >= colorNeeded) {
                    combinations.push({
                        color: color,
                        colorCount: colorNeeded,
                        locomotiveCount: locoUsed
                    });
                }
            }
        }
    }

    return combinations;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CARD_COLORS,
        LOCOMOTIVE,
        TRAIN_CARD_COUNTS,
        DESTINATION_TICKETS,
        CardDeck,
        countCardsByColor,
        canClaimRoute,
        getValidCardCombinations
    };
}
