export interface SuccessPrediction {
  successScore: number;
  competitionLevel: string; // "Low" | "Medium" | "High" | "Very High"
  effortScore: number;
  effortVsReward: string;   // "Excellent" | "Good" | "Fair" | "Poor"
  winningFactors: string[];
  redFlags: string[];
}
