// Interface defining the structure for game data
export interface GameData {
    id: number; // Unique identifier for the game
    name: string; // Name of the game
    betAmounts: number[]; // Array of allowed bet amounts for the game
    currentBalance: number; // Player's current balance in the game
}

// Interface for updating balance data
export interface UpdateBalanceData {
    amount: number; // Amount to update the balance by
    newBalance?: number; // Optional: The updated balance after applying the change
}

// Interface defining the result of a spin action
export interface SpinResultData {
    result: number; // Result of the spin (e.g., win or loss amount)
    newBalance: number; // Updated balance after the spin
}

// Interface for messages exchanged between components or windows
export interface GameMessage {
    type: 'SELECT_GAME' | 'UPDATE_BALANCE' | 'SPIN_RESULT'; // Type of message
    data: GameData | UpdateBalanceData | SpinResultData; // Associated data for the message
}

export class MessageHandler {
    private targetWindow: Window; // The target window to send messages to
    private origin: string; // The allowed origin for secure communication

    /**
     * Constructor for initializing the message handler
     * @param targetWindow - The window to which messages will be sent
     * @param origin - The expected origin for incoming messages
     */
    constructor(targetWindow: Window, origin: string) {
        this.targetWindow = targetWindow;
        this.origin = origin;
        this.setupMessageListener(); // Initialize message listener
    }

    /**
     * Sets up a listener for incoming messages
     */
    private setupMessageListener() {
        window.addEventListener('message', this.handleMessage.bind(this));
    }

    /**
     * Handles incoming messages and routes them based on their type
     * @param event - The message event received
     */
    private handleMessage(event: MessageEvent) {
        // Ensure the message is from the expected origin
        if (event.origin !== this.origin) return;

        const message = event.data as GameMessage; // Cast incoming data to GameMessage type

        // Handle different message types
        switch (message.type) {
            case 'SELECT_GAME':
                this.handleGameSelection(message.data as GameData);
                break;
            case 'UPDATE_BALANCE':
                this.handleBalanceUpdate(message.data as UpdateBalanceData);
                break;
            case 'SPIN_RESULT':
                this.handleSpinResult(message.data as SpinResultData);
                break;
        }
    }

    /**
     * Handles game selection messages
     * @param data - The game data associated with the selection
     */
    private handleGameSelection(data: GameData) {
        console.log('Game selected:', data);
    }

    /**
     * Handles balance update messages
     * @param data - The balance update data
     */
    private handleBalanceUpdate(data: UpdateBalanceData) {
        console.log('Balance updated:', data);
    }

    /**
     * Handles spin result messages
     * @param data - The spin result data
     */
    private handleSpinResult(data: SpinResultData) {
        console.log('Spin result:', data);
    }

    /**
     * Sends a message to the target window
     * @param message - The message to be sent
     */
    public sendMessage(message: GameMessage) {
        this.targetWindow.postMessage(message, this.origin);
    }
}