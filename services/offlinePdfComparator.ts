import type { ComparisonResult } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
// FIX: Changed import path for pdf.js types to the main package entrypoint
// to resolve issue with PageViewport not being exported from the internal path.
// FIX: Removed TextItem from import as it is not exported from the main pdfjs-dist entrypoint.
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import pixelmatch from 'pixelmatch';

/**
 * Extrai todo o texto de um arquivo PDF.
 */
async function extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // FIX: Replaced cast to TextItem with an inline type assertion `{ str: string }`
        // because TextItem is not exported from the main 'pdfjs-dist' module.
        fullText += textContent.items.map((item) => (item as { str: string }).str).join(' ') + '\n';
    }
    return fullText;
}

/**
 * Compara duas strings de texto para encontrar similaridade e divergências.
 */
function compareText(text1: string, text2: string): { similarity: number; divergences: number; details: string[] } {
  const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 0));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  const similarity = union.size === 0 ? 100 : (intersection.size / union.size) * 100;
  
  const details: string[] = [];
  const diff1 = [...words1].filter(word => !words2.has(word));
  const diff2 = [...words2].filter(word => !words1.has(word));

  const maxDetails = 5;
  if (diff1.length > 0) {
      details.push(`Texto removido (exemplos): "${diff1.slice(0, maxDetails).join('", "')}"`);
  }
  if (diff2.length > 0) {
      details.push(`Texto adicionado (exemplos): "${diff2.slice(0, maxDetails).join('", "')}"`);
  }

  return {
    similarity: parseFloat(similarity.toFixed(2)),
    divergences: diff1.length + diff2.length,
    details,
  };
}

/**
 * Renderiza uma página de PDF em um elemento canvas.
 */
async function renderPdfPageToCanvas(pdfDoc: PDFDocumentProxy, pageNum: number, canvas: HTMLCanvasElement): Promise<void> {
    const page = await pdfDoc.getPage(pageNum);
    const viewport: PageViewport = page.getViewport({ scale: 1.5 }); // Escala para melhor resolução
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível obter o contexto 2D do canvas.');
    
    // A asserção `as any` é usada aqui porque as definições de tipo para esta versão do pdfjs-dist
    // estão incorretas, exigindo uma propriedade `canvas` em vez da propriedade `canvasContext` que a
    // implementação de tempo de execução realmente usa. Isso contorna o erro do TypeScript.
    await page.render({ canvasContext: context, viewport: viewport } as any).promise;
}


/**
 * A função principal que orquestra a comparação offline de dois arquivos PDF.
 */
export async function comparePdfsOffline(file1: File, file2: File): Promise<ComparisonResult> {
  // 1. Comparação de Texto
  const [text1, text2] = await Promise.all([extractTextFromPdf(file1), extractTextFromPdf(file2)]);
  const textComparison = compareText(text1, text2);

  // 2. Comparação de Layout (Visual)
  const [buffer1, buffer2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
  const [pdf1, pdf2]: [PDFDocumentProxy, PDFDocumentProxy] = await Promise.all([
    pdfjsLib.getDocument({ data: buffer1 }).promise,
    pdfjsLib.getDocument({ data: buffer2 }).promise,
  ]);

  let totalMismatchedPixels = 0;
  let totalPixels = 0;
  const numPagesToCompare = Math.max(pdf1.numPages, pdf2.numPages);
  
  const canvas1 = document.createElement('canvas');
  const canvas2 = document.createElement('canvas');
  const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });
  const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });
  if (!ctx1 || !ctx2) throw new Error('Não foi possível obter o contexto 2D.');

  for (let i = 1; i <= numPagesToCompare; i++) {
      const page1Exists = i <= pdf1.numPages;
      const page2Exists = i <= pdf2.numPages;
      
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

      if (page1Exists) await renderPdfPageToCanvas(pdf1, i, canvas1);
      if (page2Exists) await renderPdfPageToCanvas(pdf2, i, canvas2);
      
      const width = Math.max(canvas1.width, canvas2.width);
      const height = Math.max(canvas1.height, canvas2.height);
      totalPixels += width * height;
      
      if (width === 0 || height === 0) continue;

      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = width;
      diffCanvas.height = height;
      const diffCtx = diffCanvas.getContext('2d');
      if (!diffCtx) continue;

      diffCtx.drawImage(canvas1, 0, 0);
      const imgData1 = diffCtx.getImageData(0, 0, width, height);
      diffCtx.clearRect(0, 0, width, height);
      diffCtx.drawImage(canvas2, 0, 0);
      const imgData2 = diffCtx.getImageData(0, 0, width, height);

      const mismatched = pixelmatch(imgData1.data, imgData2.data, null, width, height, { threshold: 0.1 });
      totalMismatchedPixels += mismatched;
  }

  const layoutSimilarity = totalPixels > 0 ? (1 - totalMismatchedPixels / totalPixels) * 100 : 100;

  const layoutDivergenceDetails = [];
  if (pdf1.numPages !== pdf2.numPages) {
    layoutDivergenceDetails.push(`Número de páginas diferente (${pdf1.numPages} no arquivo 1 vs ${pdf2.numPages} no arquivo 2).`);
  }
   if (totalMismatchedPixels > 0) {
    layoutDivergenceDetails.push(`Encontradas diferenças visuais em ${totalMismatchedPixels.toLocaleString('pt-BR')} pixels através das páginas.`);
  }

  return {
    textSimilarity: textComparison.similarity,
    textDivergences: textComparison.divergences,
    layoutSimilarity: parseFloat(layoutSimilarity.toFixed(2)),
    layoutDivergences: totalMismatchedPixels,
    textDivergenceDetails: textComparison.details,
    layoutDivergenceDetails: layoutDivergenceDetails,
  };
}