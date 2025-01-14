import { APIService, SlotMachineData } from './services/APIService.js';
import { MessageHandler, GameMessage, UpdateBalanceData, GameData } from './utils/messageHandler.js';

class ListIframe {
    private messageHandler: MessageHandler;
    private userBalance: number = 100;  // Stores the user's balance, initialized to 100

    constructor() {
        console.log('ListIframe initialized');
        
        // Initializes the message handler to communicate with a parent frame
        this.messageHandler = new MessageHandler(
            window.parent.frames[1],
            window.location.origin
        );
        
        this.initialize();  // Fetches and displays available slot machines
        this.setupMessageHandlers();  // Sets up listeners for incoming messages
    }

    // Sets up event listeners to handle messages received from the parent frame
    private setupMessageHandlers() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;  // Ensures the origin matches
            
            const message = event.data as GameMessage;
            if (message.type === 'UPDATE_BALANCE') {  // Checks for balance update messages
                const updateData = message.data as UpdateBalanceData;
                if (this.isUpdateBalanceData(updateData)) {
                    this.updateBalance(updateData);  // Updates the balance if valid data is received
                }
            }
        });
    }

    // Validates if the received data is of type UpdateBalanceData
    private isUpdateBalanceData(data: any): data is UpdateBalanceData {
        return data && typeof data.amount === 'number';
    }

    // Initializes the iframe by fetching and displaying the available slot machines
    private async initialize() {
        try {
            console.log('Initializing...');
            const machines = await APIService.fetchSlotMachines();  // Fetches machine data from API
            console.log('Machines received:', machines);
            this.renderMachines(machines);  // Displays machines on the UI
            this.updateBalanceDisplay();  // Updates the balance display
        } catch (error) {
            console.error('Error in initialize:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.showError(errorMessage);  // Displays an error message if the initialization fails
        }
    }

    // Renders the list of slot machines in the UI
    private renderMachines(machines: SlotMachineData[]) {
        console.log('Rendering machines:', machines);
        const container = document.getElementById('slotMachinesList');
        if (!container) {
            console.error('Container not found!');
            return;
        }

        container.innerHTML = '';  // Clears existing content

        machines.forEach(machine => {
            const element = document.createElement('div');
            element.className = 'slot-machine-item';  // Adds a CSS class for styling
            element.innerHTML = `
                <h3>${machine.name}</h3>
                <p>ID: ${machine.id}</p>
                <p>Available Bets: ${machine.betAmounts.map(amount => 
                    `$${amount}`).join(', ')}</p>
            `;
            
            // Adds a click event to select the machine when clicked
            element.addEventListener('click', () => this.selectMachine(machine));
            container.appendChild(element);
            console.log('Added machine:', machine.name);
        });
    }

    // Updates the user's balance and handles negative balances appropriately
    private updateBalance(data: UpdateBalanceData) {
        console.log('Updating balance with data:', data);
        if (data.newBalance !== undefined) {
            this.userBalance = data.newBalance;  // Sets the balance if newBalance is provided
        } else {
            const newBalance = this.userBalance + data.amount;  // Calculates the new balance
            if (newBalance < 0) {
                this.showError('Insufficient funds!');  // Displays an error if the balance is insufficient
                return;
            }
            this.userBalance = newBalance;
        }
        this.updateBalanceDisplay();  // Updates the balance on the UI
    }

    // Updates the balance display in the UI
    private updateBalanceDisplay() {
        const balanceElement = document.getElementById('userBalance');
        if (balanceElement) {
            balanceElement.textContent = this.userBalance.toFixed(2);  // Displays the balance with two decimals
        }
    }

    // Handles the selection of a slot machine and sends a message to the game iframe
    private selectMachine(machine: SlotMachineData) {
        console.log('Machine selected:', machine);
        const minBet = Math.min(...machine.betAmounts);  // Gets the minimum bet amount
        if (this.userBalance < minBet) {
            this.showError(`Insufficient balance! Minimum required: $${minBet}`);  // Error if balance is too low
            return;
        }

        // Sends a message to select the game and set the user's balance
        const message: GameMessage = {
            type: 'SELECT_GAME',
            data: {
                ...machine,
                currentBalance: this.userBalance
            } as GameData
        };
        this.messageHandler.sendMessage(message);
    }

    // Displays an error message in the UI
    private showError(message: string) {
        console.error('Error:', message);
        const container = document.querySelector('.list-container');
        let errorElement = document.getElementById('listError');
        
        // Creates the error element if it doesn't exist
        if (!errorElement && container) {
            errorElement = document.createElement('div');
            errorElement.id = 'listError';
            errorElement.className = 'error-message';
            container.appendChild(errorElement);
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                if (errorElement) {
                    errorElement.style.display = 'none';  // Hides the error message after 3 seconds
                }
            }, 3000);
        }
    }
}

// Initializes the ListIframe class once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating ListIframe');
    new ListIframe();
});