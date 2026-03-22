import type { Grant } from './nih';

export interface MatchResult {
  grantId: number;
  score: number;
  reason: string;
  grant: Grant;
}

export interface SuccessPrediction {
  successScore: number;
  competitionLevel: string; // "Low" | "Medium" | "High" | "Very High"
  effortScore: number;
  effortVsReward: string;   // "Excellent" | "Good" | "Fair" | "Poor"
  winningFactors: string[];
  redFlags: string[];
}
