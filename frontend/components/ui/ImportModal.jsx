"use client";

import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export default function ImportModal({ open, onClose, onImportComplete }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [errors, setErrors] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
        }

        setFile(selectedFile);
        parseCSV(selectedFile);
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            const data = lines.slice(1, 6).map((line, idx) => {
                const values = line.split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] || '';
                });
                row._rowIndex = idx + 2; // +2 because header is row 1
                return row;
            });

            // Validate
            const validationErrors = [];
            data.forEach(row => {
                if (!row.Name) validationErrors.push(`Row ${row._rowIndex}: Name is required`);
                if (!row.Price || isNaN(Number(row.Price))) validationErrors.push(`Row ${row._rowIndex}: Invalid price`);
                if (!row.Category) validationErrors.push(`Row ${row._rowIndex}: Category is required`);
            });

            setPreview(data);
            setErrors(validationErrors);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (errors.length > 0) {
            alert('Please fix validation errors before importing');
            return;
        }

        try {
            setImporting(true);
            const formData = new FormData();
            formData.append('file', file);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const token = localStorage.getItem('token');
            
            const res = await fetch(`${apiUrl}/menu/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            
            if (data.success) {
                setResult({
                    success: data.imported || 0,
                    failed: data.failed || 0,
                    errors: data.errors || []
                });
                
                if (onImportComplete) {
                    onImportComplete();
                }
            } else {
                alert('Import failed: ' + data.error);
            }
        } catch (err) {
            alert('Import failed: ' + err.message);
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csv = 'Name,Price,Category,Portion Size,Tags,Description\n' +
                    'Grilled Chicken,1200,Main Course,Medium (M),"Chef\'s Special,Bestseller",Delicious grilled chicken\n' +
                    'Caesar Salad,800,Starters,Small (S),Vegan,Fresh caesar salad';
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'menu_import_template.csv';
        a.click();
    };

    const handleClose = () => {
        setFile(null);
        setPreview([]);
        setErrors([]);
        setResult(null);
        onClose();
    };

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="bg-[#0f1923] rounded-2xl border border-[#2a3a4a] w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#2a3a4a] flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Import Menu Items</h2>
                            <p className="text-sm text-gray-400 mt-1">Upload CSV file to bulk import menu items</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {!result ? (
                            <>
                                {/* Download Template */}
                                <div className="mb-6">
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Download CSV Template</span>
                                    </button>
                                </div>

                                {/* Upload Zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                                        file ? "border-cyan-500 bg-cyan-500/5" : "border-[#2a3a4a] hover:border-cyan-500/50 bg-[#1a2535]"
                                    )}
                                >
                                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                    {file ? (
                                        <div>
                                            <p className="text-white font-semibold mb-1">{file.name}</p>
                                            <p className="text-sm text-gray-400">Click to change file</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-white font-semibold mb-1">Click to upload CSV file</p>
                                            <p className="text-sm text-gray-400">or drag and drop</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />

                                {/* Preview */}
                                {preview.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-white font-semibold mb-3">Preview (First 5 rows)</h3>
                                        <div className="bg-[#1a2535] rounded-xl border border-[#2a3a4a] overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-[#0f1923]">
                                                        <tr className="text-gray-400 text-xs uppercase">
                                                            <th className="px-4 py-3 text-left">Name</th>
                                                            <th className="px-4 py-3 text-left">Price</th>
                                                            <th className="px-4 py-3 text-left">Category</th>
                                                            <th className="px-4 py-3 text-left">Portion</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#2a3a4a]">
                                                        {preview.map((row, idx) => (
                                                            <tr key={idx} className="text-gray-300">
                                                                <td className="px-4 py-3">{row.Name}</td>
                                                                <td className="px-4 py-3">{row.Price}</td>
                                                                <td className="px-4 py-3">{row.Category}</td>
                                                                <td className="px-4 py-3">{row['Portion Size']}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Errors */}
                                {errors.length > 0 && (
                                    <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-400 font-semibold mb-2">Validation Errors</p>
                                                <ul className="text-sm text-red-300 space-y-1">
                                                    {errors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Result */
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">Import Complete!</h3>
                                <p className="text-gray-400 mb-6">
                                    <span className="text-emerald-400 font-semibold">{result.success}</span> items imported successfully
                                    {result.failed > 0 && (
                                        <>, <span className="text-red-400 font-semibold">{result.failed}</span> failed</>
                                    )}
                                </p>
                                {result.errors.length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left max-h-40 overflow-y-auto">
                                        <p className="text-red-400 font-semibold mb-2">Errors:</p>
                                        <ul className="text-sm text-red-300 space-y-1">
                                            {result.errors.map((err, idx) => (
                                                <li key={idx}>• {err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!result && (
                        <div className="p-6 border-t border-[#2a3a4a] flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="border-[#2a3a4a] text-gray-400 hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || errors.length > 0 || importing}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                {importing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Import Items
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
