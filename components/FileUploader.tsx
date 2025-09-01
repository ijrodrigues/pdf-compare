
import React, { useState, useCallback, useRef } from 'react';
import { DocumentUploadIcon } from './icons/DocumentUploadIcon';
import { PdfIcon } from './icons/PdfIcon';

interface FileUploaderProps {
  onFileDrop: (file: File) => void;
  file: File | null;
  id: string;
  label: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileDrop, file, id, label }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(over);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    handleDrag(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        onFileDrop(droppedFile);
      }
      e.dataTransfer.clearData();
    }
  }, [handleDrag, onFileDrop]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const selectedFile = e.target.files[0];
       if (selectedFile.type === 'application/pdf') {
         onFileDrop(selectedFile);
       }
    }
  };
  
  const handleClick = () => {
      inputRef.current?.click();
  };

  const uploaderClass = `flex flex-col items-center justify-center p-6 h-64 bg-gray-800 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
    isDraggingOver ? 'border-blue-500 bg-gray-700 scale-105' : 'border-gray-600 hover:border-gray-500'
  }`;

  return (
    <div>
        <p className="text-center text-lg font-semibold text-gray-400 mb-2">{label}</p>
        <div
          className={uploaderClass}
          onDragEnter={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDragOver={(e) => handleDrag(e, true)}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input 
            type="file" 
            ref={inputRef} 
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
            id={id}
          />
          {file ? (
            <div className="text-center">
              <PdfIcon className="w-16 h-16 mx-auto text-red-500 mb-2" />
              <p className="text-lg font-semibold text-gray-200 break-all">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <DocumentUploadIcon className="w-16 h-16 mx-auto mb-2" />
              <p className="font-semibold text-lg">Arraste e solte o PDF aqui</p>
              <p className="text-sm">ou clique para selecionar</p>
            </div>
          )}
        </div>
    </div>
  );
};
