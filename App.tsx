import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { ComparisonResults } from './components/ComparisonResults';
import { Loader } from './components/Loader';
import { comparePdfsOffline } from './services/offlinePdfComparator';
import type { ComparisonResult } from './types';
import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do pdf.js globalmente. Ele é necessário para o processamento em segundo plano.
// Usamos a versão .mjs para compatibilidade com módulos ES.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs';


const App: React.FC = () => {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompareClick = useCallback(async () => {
    if (!file1 || !file2) {
      setError("Por favor, carregue ambos os arquivos PDF para comparar.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const comparisonData = await comparePdfsOffline(file1, file2);
      setResults(comparisonData);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setError(`Falha na comparação: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [file1, file2]);

  const handleFile1Drop = (file: File) => {
    setFile1(file);
    setError(null);
    setResults(null);
  };
  
  const handleFile2Drop = (file: File) => {
    setFile2(file);
    setError(null);
    setResults(null);
  };

  const areButtonsDisabled = !file1 || !file2 || isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Comparador de PDF Offline
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Arraste e solte dois arquivos PDF para analisar suas similaridades de texto e layout, 100% no seu navegador.
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FileUploader onFileDrop={handleFile1Drop} file={file1} id="file1" label="PDF Original" />
            <FileUploader onFileDrop={handleFile2Drop} file={file2} id="file2" label="PDF para Comparar" />
          </div>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <button
              onClick={handleCompareClick}
              disabled={areButtonsDisabled}
              className="relative flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isLoading && <Loader />}
              <span className={isLoading ? 'ml-3' : ''}>
                {isLoading ? 'Analisando...' : 'Comparar Arquivos'}
              </span>
            </button>
          </div>

          {error && (
            <div className="text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 max-w-2xl mx-auto">
              <p>{error}</p>
            </div>
          )}

          {results && !isLoading && (
             <div className="animate-fade-in">
                <ComparisonResults results={results} />
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;