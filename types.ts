export interface ComparisonResult {
  textSimilarity: number;
  textDivergences: number;
  layoutSimilarity: number;
  layoutDivergences: number;
  textDivergenceDetails: string[];
  layoutDivergenceDetails: string[];
}