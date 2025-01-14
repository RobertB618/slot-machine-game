import { MessageHandler, GameMessage, GameData, UpdateBalanceData } from './utils/messageHandler.js';
import { SlotMachine } from './models/SlotMachine.js';

class GameIframe {
    private messageHandler: MessageHandler; // Handles communication between iframes
    private currentMachine: SlotMachine | null = null; // Active slot machine instance
    private selectedBetAmount: number = 0; // Current selected bet amount
    private currentBalance: number = 0; // Player's current balance
    private lastReceivedData: GameData | null = null; // Stores the last game data received

    constructor() {
        // Initializes the message handler with parent window and current origin
        this.messageHandler = new MessageHandler(
            window.parent.frames[0],
            window.location.origin
        );
        this.initialize(); // Set up game event listeners and message handling
    }

    // Validates whether the selected bet can be placed based on current balance
    private validateBet() {
        const spinButton = document.getElementById('spinButton') as HTMLButtonElement;
        const betSelect = document.getElementById('betAmount') as HTMLSelectElement;
        if (!spinButton || !betSelect) return;

        const selectedBet = Number(betSelect.value);
        // Disable spin button if bet exceeds balance, show error message
        if (selectedBet > this.currentBalance) {
            spinButton.disabled = true;
            this.showError('¡Not enough money!');
            this.updateAvailableBets();
        } else {
            spinButton.disabled = false;
            const errorElement = document.getElementById('error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    // Updates available bet options based on the current balance
    private updateAvailableBets() {
        const betSelect = document.getElementById('betAmount') as HTMLSelectElement;
        if (!betSelect || !this.lastReceivedData) return;

        // Filter bets that are less than or equal to current balance
        const allBets = this.lastReceivedData.betAmounts;
        const availableBets = allBets.filter((bet: number) => bet <= this.currentBalance);

        // Populate bet options or show "no available bets" message
        betSelect.innerHTML = availableBets.length > 0 
            ? availableBets.map(amount => `<option value="${amount}">${amount}$</option>`).join('')
            : '<option value="0">Sin apuestas disponibles</option>';

        const spinButton = document.getElementById('spinButton') as HTMLButtonElement;
        if (spinButton) {
            spinButton.disabled = availableBets.length === 0;
        }

        // Show an error if no bets are available due to insufficient balance
        if (availableBets.length === 0) {
            this.showError('Balance insuficiente para jugar en esta máquina');
        } else {
            this.selectedBetAmount = availableBets[0];
        }
    }

    // Initializes event listeners for the game
    private initialize() {
        const spinButton = document.getElementById('spinButton') as HTMLButtonElement;
        spinButton.addEventListener('click', () => this.spin());

        const betSelect = document.getElementById('betAmount') as HTMLSelectElement;
        betSelect.addEventListener('change', (e) => {
            const newBetAmount = Number((e.target as HTMLSelectElement).value);
            if (newBetAmount > this.currentBalance) {
                spinButton.disabled = true;
                this.showError('¡Balance insuficiente para esta apuesta!');
                return;
            }
            this.selectedBetAmount = newBetAmount;
            spinButton.disabled = false;
        });

        // Listen for incoming messages and handle game selection messages
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            const message = event.data as GameMessage;
            if (message.type === 'SELECT_GAME') {
                const gameData = message.data as GameData;
                if (this.isGameData(gameData)) {
                    this.handleGameSelection(gameData);
                }
            }
        });
    }

    // Type guard to check if data conforms to GameData interface
    private isGameData(data: any): data is GameData {
        return (
            data &&
            typeof data.id === 'number' &&
            typeof data.name === 'string' &&
            Array.isArray(data.betAmounts) &&
            typeof data.currentBalance === 'number'
        );
    }

    // Handles game selection messages and updates UI
    public handleGameSelection(data: GameData) {
        this.currentMachine = new SlotMachine(data.id, data.name);
        this.currentBalance = data.currentBalance;
        this.lastReceivedData = data;

        this.renderGame(data);

        setTimeout(() => this.validateBet(), 0);
    }

    // Renders game information on the UI
    private renderGame(data: GameData) {
        const gameInfo = document.getElementById('gameInfo');
        const betSelect = document.getElementById('betAmount') as HTMLSelectElement;
        const spinButton = document.getElementById('spinButton') as HTMLButtonElement;

        if (gameInfo && betSelect) {
            gameInfo.innerHTML = `
                <h2>${data.name}</h2>
                <p>ID: ${data.id}</p>
                <p>Current Balance: $${this.currentBalance.toFixed(2)}</p>
            `;

            const availableBets = data.betAmounts.filter((bet: number) => bet <= this.currentBalance);

            if (availableBets.length === 0) {
                betSelect.innerHTML = '<option value="0">Sin apuestas disponibles</option>';
                spinButton.disabled = true;
                this.showError('Balance insuficiente para jugar en esta máquina');
                return;
            }

            betSelect.innerHTML = availableBets
                .map(amount => `<option value="${amount}">${amount}$</option>`)
                .join('');

            this.selectedBetAmount = availableBets[0];
            spinButton.disabled = false;
        }
    }

    // Simulates spinning the slot machine and updates the balance
    private async spin() {
        if (!this.currentMachine || this.selectedBetAmount <= 0) {
            this.showError('Seleccione una apuesta válida');
            return;
        }

        if (this.selectedBetAmount > this.currentBalance) {
            this.showError('¡Balance insuficiente para esta apuesta!');
            this.updateAvailableBets();
            return;
        }

        try {
            const spinButton = document.getElementById('spinButton') as HTMLButtonElement;
            spinButton.disabled = true;

            this.currentBalance -= this.selectedBetAmount;
            this.updateBalanceDisplay();

            this.currentMachine.placeBet(this.selectedBetAmount);
            const result = this.currentMachine.spin();

            await this.animateSpin();

            this.currentBalance += (this.selectedBetAmount + result);
            this.showResult(result);

            // Send updated balance message to parent window
            const message: GameMessage = {
                type: 'UPDATE_BALANCE',
                data: {
                    amount: result,
                    newBalance: this.currentBalance
                } as UpdateBalanceData
            };
            this.messageHandler.sendMessage(message);

            this.updateBalanceDisplay();
            this.updateAvailableBets();

        } catch (error) {
            if (error instanceof Error) {
                this.showError(error.message);
            } else {
                this.showError('Ha ocurrido un error inesperado');
            }
        } finally {
            setTimeout(() => {
                const spinButton = document.getElementById('spinButton') as HTMLButtonElement;
                if (spinButton) {
                    spinButton.disabled = false;
                    this.validateBet();
                }
            }, 1000);
        }
    }

    // Updates the displayed balance in the UI
    private updateBalanceDisplay() {
        const gameInfo = document.getElementById('gameInfo');
        if (gameInfo) {
            const balanceText = gameInfo.querySelector('p:last-child');
            if (balanceText) {
                balanceText.textContent = `Current balance: $${this.currentBalance.toFixed(2)}`;
            }
        }
    }

    // Animates the spin result display
    private async animateSpin(): Promise<void> {
        const resultElement = document.getElementById('result');
        if (resultElement) {
            resultElement.style.opacity = '0';
            resultElement.className = '';
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Displays the spin result message
    private showResult(result: number) {
        const resultElement = document.getElementById('result');
        if (!resultElement) return;

        const isWin = result > 0;
        const className = isWin ? 'win' : 'loss';
        const message = isWin ? 'WIN!' : 'LOSE!';
        const amount = Math.abs(result).toFixed(2);

        resultElement.className = className;
        resultElement.innerHTML = `
            <h3>${message}</h3>
            <p>${isWin ? '+' : '-'}${amount}$</p>
        `;

        resultElement.style.opacity = '0';
        resultElement.classList.add('show');

        setTimeout(() => {
            resultElement.style.opacity = '1';
        }, 50);
    }

    // Displays error messages in the UI
    private showError(message: string) {
        const errorElement = document.getElementById('error');
        if (!errorElement) return;

        errorElement.style.display = 'block';
        errorElement.textContent = message;

        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// Initialize the game iframe when the page loads
new GameIframe();