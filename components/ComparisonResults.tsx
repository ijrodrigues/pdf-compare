import React from 'react';
import type { ComparisonResult } from '../types';

interface ResultBadgeProps {
  label: string;
  value: string | number;
  colorClass: string;
}

const ResultBadge: React.FC<ResultBadgeProps> = ({ label, value, colorClass }) => (
  <div className="flex-1 min-w-[200px] bg-gray-800 p-4 rounded-lg text-center shadow-md border-t-4 border-gray-700">
    <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</p>
    <p className={`text-4xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

interface DivergenceListProps {
    title: string;
    details: string[];
    colorClass: string;
}

const DivergenceList: React.FC<DivergenceListProps> = ({ title, details, colorClass }) => {
    if (details.length === 0) return null;

    return (
        <div className="bg-gray-900/70 p-4 rounded-lg">
            <h4 className={`font-semibold ${colorClass} mb-2 text-lg`}>{title}</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm pl-2">
            {details.map((detail, index) => (
                <li key={index}>{detail}</li>
            ))}
            </ul>
        </div>
    );
}


interface ComparisonResultsProps {
  results: ComparisonResult;
}

export const ComparisonResults: React.FC<ComparisonResultsProps> = ({ results }) => {
  const hasDivergences = results.textDivergenceDetails?.length > 0 || results.layoutDivergenceDetails?.length > 0;
  
  return (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-2xl max-w-4xl mx-auto border border-gray-700">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-200">Resultados da Análise</h2>
      <div className="flex flex-wrap justify-center gap-6">
        <ResultBadge label="Similaridade de Texto" value={`${results.textSimilarity}%`} colorClass="text-green-400" />
        <ResultBadge label="Divergências no Texto" value={results.textDivergences} colorClass="text-yellow-400" />
        <ResultBadge label="Similaridade de Layout" value={`${results.layoutSimilarity}%`} colorClass="text-blue-400" />
        <ResultBadge label="Divergências no Layout" value={results.layoutDivergences} colorClass="text-purple-400" />
      </div>

      {hasDivergences && (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-xl font-bold text-center mb-4 text-gray-300">Detalhes das Divergências</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DivergenceList 
                    title="Divergências de Texto"
                    details={results.textDivergenceDetails}
                    colorClass="text-yellow-400"
                />
                <DivergenceList 
                    title="Divergências de Layout"
                    details={results.layoutDivergenceDetails}
                    colorClass="text-purple-400"
                />
            </div>
        </div>
      )}
    </div>
  );
};