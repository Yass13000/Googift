import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Link2, Check, AlertCircle } from 'lucide-react';
import { uploadImage } from '../../lib/storage';


interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  folder: 'logos' | 'rewards' | 'banners';
  restaurantId: string;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'circle' | 'wide';
}


export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  folder,
  restaurantId,
  label = 'Image',
  helperText = 'PNG, JPG ou WebP jusqu\'à 5 Mo',
  aspectRatio = 'square'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManualUrl, setIsManualUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsUploading(true);

    const result = await uploadImage(file, folder, restaurantId);
    setIsUploading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.url) {
      onChange(result.url);
      setUrlInput(result.url);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (

    <div className="space-y-2">
      {/* Label and mode toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsManualUrl(!isManualUrl)}
          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
        >
          <Link2 className="w-3 h-3" />
          <span>{isManualUrl ? 'Mode Fichier / Glisser-déposer' : 'Saisir une URL'}</span>
        </button>
      </div>

      {/* Manual URL Input mode */}
      {isManualUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="https://votresite.com/image.png"
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            {urlInput && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={value}
                alt="Aperçu"
                className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="text-[11px] text-slate-500 truncate flex-1 font-mono">{value}</span>
            </div>
          )}
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div className="space-y-2">
          {value ? (
            /* Current Image Preview */
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className={`relative bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 ${
                aspectRatio === 'circle' ? 'w-14 h-14 rounded-full overflow-hidden' : 'w-14 h-14 rounded-xl'
              }`}>
                <img
                  src={value}
                  alt="Aperçu"
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Image importée
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{value}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Dropzone Empty State */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-rose-500 bg-rose-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">Envoi vers Supabase Storage...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Glissez une image ici ou <span className="text-rose-600">parcourez</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{helperText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
