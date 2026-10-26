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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg bg-[#10141B] border border-[#28313D] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-sm">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#28313D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#151A22] border border-[#28313D] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <h2 id="csv-modal-title" className="text-base font-semibold text-[#F1F5F9] leading-tight">
                Import NASA FIRMS CSV
              </h2>
              <p className="text-xs text-[#A4AFBF] mt-0.5">
                Load custom active-fire observations for cross-sensor harmonization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#A4AFBF] hover:text-[#F1F5F9] hover:bg-[#151A22] transition-colors"
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
                  ? "border-[#F59E0B] bg-[#F59E0B]/5"
                  : "border-[#28313D] hover:border-[#A4AFBF] bg-[#090B0F]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileText className={`w-8 h-8 mb-2 ${selectedFile ? "text-[#F59E0B]" : "text-[#6E7A8A]"}`} />
              {selectedFile ? (
                <div>
                  <span className="font-medium text-[#F1F5F9] font-mono text-xs">{selectedFile.name}</span>
                  <p className="text-[11px] text-[#A4AFBF] mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose another file
                  </p>
                </div>
              ) : (
                <div>
                  <span className="font-medium text-[#F1F5F9] text-xs">
                    Drop your NASA FIRMS CSV here, or browse
                  </span>
                  <p className="text-[11px] text-[#A4AFBF] mt-1">
                    Requires standard columns: latitude, longitude, acq_date (YYYY-MM-DD)
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold block">Import Error</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#28313D]">
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
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-sm text-[#F1F5F9] block">
                  Harmonization complete!
                </span>
                <p className="text-xs text-[#A4AFBF]">
                  Imported <span className="font-mono text-[#F1F5F9]">{successResult.imported_rows}</span> valid active fire records from <span className="font-mono text-[#F1F5F9]">{successResult.filename}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-[#090B0F] p-3 rounded-xl border border-[#28313D]">
                <span className="text-[#A4AFBF] text-[11px] block">Total rows</span>
                <span className="text-lg font-bold font-mono text-[#F1F5F9]">
                  {successResult.total_rows}
                </span>
              </div>
              <div className="bg-[#090B0F] p-3 rounded-xl border border-[#28313D]">
                <span className="text-[#A4AFBF] text-[11px] block">Valid detections</span>
                <span className="text-lg font-bold font-mono text-[#34D399]">
                  {successResult.imported_rows}
                </span>
              </div>
              <div className="bg-[#090B0F] p-3 rounded-xl border border-[#28313D]">
                <span className="text-[#A4AFBF] text-[11px] block">Skipped/invalid</span>
                <span className="text-lg font-bold font-mono text-[#F59E0B]">
                  {successResult.malformed_rows}
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {successResult.sample_warnings && successResult.sample_warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-[#090B0F] border border-[#28313D] text-[11px] text-[#A4AFBF] space-y-1">
                <span className="font-medium text-[#F59E0B] block">Row warnings sample:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {successResult.sample_warnings.map((w, idx) => (
                    <li key={idx} className="font-mono text-[10px]">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#28313D]">
              <button
                onClick={handleReset}
                className="text-xs text-[#A4AFBF] hover:text-[#F1F5F9] transition-colors"
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
