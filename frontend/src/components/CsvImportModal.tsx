"use client";

import React, { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { uploadCsvFile, ImportCsvResponse } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportCsvResponse) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ImportCsvResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Only .csv files are supported. Please choose a valid NASA FIRMS CSV.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccessResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Only .csv files are supported. Please choose a valid NASA FIRMS CSV.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccessResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadCsvFile(selectedFile);
      setSuccessResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to import CSV file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleApply = () => {
    if (successResult) {
      onImportSuccess(successResult);
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setError(null);
    setSuccessResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg bg-[#101216] border border-[#2A3039] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-sm">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A3039]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171A20] border border-[#2A3039] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#F5B32F]" />
            </div>
            <div>
              <h2 id="csv-modal-title" className="text-base font-semibold text-[#F4F5F7] leading-tight">
                Import NASA FIRMS CSV
              </h2>
              <p className="text-xs text-[#B1B7C1] mt-0.5">
                Load custom active-fire observations for cross-sensor harmonization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#B1B7C1] hover:text-[#F4F5F7] hover:bg-[#171A20] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B32F]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload State & Drop Area */}
        {!successResult ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                selectedFile
                  ? "border-[#F5B32F] bg-[#F5B32F]/5"
                  : "border-[#2A3039] hover:border-[#B1B7C1] bg-[#08090B]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText className={`w-8 h-8 mb-2 ${selectedFile ? "text-[#F5B32F]" : "text-[#858D99]"}`} />
              {selectedFile ? (
                <div>
                  <span className="font-medium text-[#F4F5F7] font-mono text-xs">{selectedFile.name}</span>
                  <p className="text-[11px] text-[#B1B7C1] mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose another file
                  </p>
                </div>
              ) : (
                <div>
                  <span className="font-medium text-[#F4F5F7] text-xs">
                    Drop your NASA FIRMS CSV here, or browse
                  </span>
                  <p className="text-[11px] text-[#B1B7C1] mt-1">
                    Requires standard columns: latitude, longitude, acq_date (YYYY-MM-DD)
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-[#8F2529]/30 border border-[#E5484D]/50 text-[#F87171] text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E5484D] shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold block">Import Error</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2A3039]">
              <Button variant="secondary" size="sm" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="flex items-center gap-1.5"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUploading ? "Validating & importing..." : "Upload & harmonize"}</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Success Summary */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-sm text-[#F4F5F7] block">
                  Harmonization complete!
                </span>
                <p className="text-xs text-[#B1B7C1]">
                  Imported <span className="font-mono text-[#F4F5F7]">{successResult.imported_rows}</span> valid active fire records from <span className="font-mono text-[#F4F5F7]">{successResult.filename}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-[#08090B] p-3 rounded-xl border border-[#2A3039]">
                <span className="text-[#858D99] text-[11px] block">Total rows</span>
                <span className="text-lg font-bold font-mono text-[#F4F5F7]">
                  {successResult.total_rows}
                </span>
              </div>
              <div className="bg-[#08090B] p-3 rounded-xl border border-[#2A3039]">
                <span className="text-[#858D99] text-[11px] block">Valid detections</span>
                <span className="text-lg font-bold font-mono text-[#34D399]">
                  {successResult.imported_rows}
                </span>
              </div>
              <div className="bg-[#08090B] p-3 rounded-xl border border-[#2A3039]">
                <span className="text-[#858D99] text-[11px] block">Skipped/invalid</span>
                <span className="text-lg font-bold font-mono text-[#F5B32F]">
                  {successResult.malformed_rows}
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {successResult.sample_warnings && successResult.sample_warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-[#08090B] border border-[#2A3039] text-[11px] text-[#B1B7C1] space-y-1">
                <span className="font-medium text-[#F5B32F] block">Row warnings sample:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {successResult.sample_warnings.map((w, idx) => (
                    <li key={idx} className="font-mono text-[10px]">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#2A3039]">
              <button
                onClick={handleReset}
                className="text-xs text-[#B1B7C1] hover:text-[#F4F5F7] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Upload another file
              </button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Dismiss
                </Button>
                <Button variant="primary" size="sm" onClick={handleApply}>
                  View imported dataset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
