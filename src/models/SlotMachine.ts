// src/models/SlotMachine.ts
import { SlotMachineInterface } from '../interfaces/SlotMachineInterface';

/**
 * Implementation of the slot machine
 */
export class SlotMachine implements SlotMachineInterface {
    id: number; // Unique identifier for the slot machine
    name: string; // Name of the slot machine
    betAmount: number; // Current bet amount
    private readonly minWin: number = -100; // Maximum loss limit
    private readonly maxWin: number = 200;  // Maximum win limit

    /**
     * Constructor for the SlotMachine class
     * @param id - Unique identifier for the machine
     * @param name - Name of the machine
     */
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.betAmount = 0; // Initialize bet amount to zero
    }

    /**
     * Sets the bet amount
     * @param betAmount - Amount to be bet
     * @throws Error if the bet is invalid (non-positive)
     */
    placeBet(betAmount: number): void {
        if (betAmount <= 0) {
            throw new Error('The bet must be greater than 0');
        }
        this.betAmount = betAmount;
    }

    /**
     * Simulates spinning the slot machine
     * @returns A positive number for a win, negative for a loss, 
     *          multiplied by the bet amount
     * @throws Error if no bet has been placed
     */
    spin(): number {
        if (this.betAmount <= 0) {
            throw new Error('You must place a bet before spinning');
        }

        // Generate a random number between minWin and maxWin
        const multiplier = Math.floor(Math.random() * (this.maxWin - this.minWin + 1)) + this.minWin;
        
        // Calculate the result as the multiplier times the bet amount
        const result = (multiplier / 100) * this.betAmount;

        // Round to 2 decimal places to avoid floating-point issues
        return Math.round(result * 100) / 100;
    }

    /**
     * Validates if a bet is within the allowed limits
     * @param betAmount - Amount to validate
     * @returns true if the bet is valid
     */
    static isValidBet(betAmount: number): boolean {
        return betAmount > 0;
    }
}