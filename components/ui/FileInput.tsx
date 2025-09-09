import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileInputProps {
  id: string;
  onChange: (file: File | null) => void;
}

const FileInput: React.FC<FileInputProps> = ({ id, onChange }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileName(null);
      setPreview(null);
    }
    onChange(file);
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFileName(null);
    setPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    onChange(null);
  }

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  }

  return (
    <div>
      <input
        type="file"
        id={id}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <div
        onClick={handleContainerClick}
        className="w-full p-4 bg-neutral-600 border-2 border-dashed border-neutral-500 rounded-md text-center cursor-pointer hover:border-brand-primary transition-colors"
        role="button"
        tabIndex={0}
        aria-label="Seleccionar archivo"
      >
        {!preview ? (
            <div className="flex flex-col items-center justify-center text-neutral-200">
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm">Toca para subir una foto</p>
                <p className="text-xs text-neutral-600">JPG, PNG, WEBP (Máx 5MB)</p>
            </div>
        ) : (
            <div className="relative group">
                <img src={preview} alt="Vista previa" className="max-h-32 mx-auto rounded-md" />
                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <button 
                        onClick={handleRemoveImage}
                        className="bg-expense text-white p-2 rounded-full hover:bg-expense/80"
                        aria-label="Quitar imagen"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileInput;