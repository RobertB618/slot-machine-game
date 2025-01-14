// Interface defining the structure of slot machine data
export interface SlotMachineData {
    id: number; // Unique identifier for each slot machine
    name: string; // Name of the slot machine
    betAmounts: number[]; // Array of available bet amounts for the machine
}

export class APIService {
    // Mock data simulating a response from a backend service
    private static mockData = {
        slotMachines: [
            {
                id: 1,
                name: "Slot Machine A",
                betAmounts: [1, 5, 10, 20] // Available bet amounts for Slot Machine A
            },
            {
                id: 2,
                name: "Slot Machine B",
                betAmounts: [2, 5, 25, 50] // Available bet amounts for Slot Machine B
            },
            {
                id: 3,
                name: "Slot Machine C",
                betAmounts: [5, 10, 25, 100] // Available bet amounts for Slot Machine C
            }
        ]
    };

    /**
     * Simulates fetching slot machines from an API
     * @returns A promise resolving with an array of slot machine data
     * @throws An error if the fetch simulation fails
     */
    public static async fetchSlotMachines(): Promise<SlotMachineData[]> {
        console.log('Fetching slot machines...'); // Log fetching operation for debugging

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate a 95% success rate for fetching data
                if (Math.random() > 0.05) {
                    console.log('Machines fetched:', this.mockData.slotMachines); // Log fetched data
                    resolve(this.mockData.slotMachines); // Resolve promise with mock data
                } else {
                    reject(new Error('Error loading slot machines')); // Simulate an error condition
                }
            }, 500); // Simulate network delay of 500ms
        });
    }
}