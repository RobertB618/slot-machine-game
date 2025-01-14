export interface SlotMachineInterface {
    // Required properties
    id: number; // Unique identifier for the slot machine
    name: string; // Name of the slot machine
    betAmount: number; // Current bet amount placed on the slot machine

    // Required methods
    placeBet(betAmount: number): void; // Places a bet of a specified amount
    spin(): number; // Spins the slot machine and returns a number indicating the result
}
