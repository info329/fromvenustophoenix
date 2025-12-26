// Scoring engine types

export interface Response {
  questionId: string;
  value: string | string[] | number;
}

export interface DimensionScore {
  dimensionId: string;
  code: string;
  name: string;
  category: string;
  rawScore: number;
  normalizedScore: number; // 0-100
  contributions: Contribution[];
}

export interface Contribution {
  type: 'weight' | 'rule';
  sourceId: string;
  sourceName: string;
  questionId?: string;
  questionText?: string;
  answerValue?: string;
  delta: number;
  explanation: string;
}

export interface ScoringResult {
  rankedFocusAreas: RankedFocusArea[];
  confidenceScore: number;
  confidenceFactors: ConfidenceFactor[];
  allDimensionScores: DimensionScore[];
  modelVersion: string;
  timestamp: string;
}

export interface RankedFocusArea {
  rank: number;
  dimension: DimensionScore;
  probability: 'High' | 'Medium' | 'Low';
  prepTimeAllocation: number; // percentage
  likelyQuestions: string[];
  redFlags: string[];
}

export interface ConfidenceFactor {
  factor: string;
  impact: 'positive' | 'negative';
  value: number;
}
