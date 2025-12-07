import React, { useState, useCallback } from 'react';
import ExcelJS from 'exceljs';
import { useLanguage } from '@/context/LanguageContext';
import { Upload, FileUp, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { normalizeHeader } from '@/utils/importUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPaddlers: (data: any[]) => Promise<void>;
  onImportEvents: (data: any[]) => Promise<void>;
}

type ImportType = 'paddler' | 'event';

export const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImportPaddlers, 
  onImportEvents 
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ImportType>('paddler');
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    setFile(file);
    setError(null);
    setSuccess(null);
    setPreviewData([]);

    try {
      const data = await parseExcel(file);
      setPreviewData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error parsing file');
    }
  };

  const parseExcel = async (file: File): Promise<any[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    
    // Check extension
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (isCsv) {
        // Manual CSV parsing for browser compatibility (exceljs csv.read requires node streams)
        const text = await file.text();
        const sheet = workbook.addWorksheet('Sheet1');
        const rows = text.split(/\r?\n/);
        
        rows.forEach(r => {
            if (r.trim()) {
                // Split by comma, semicolon, pipe, or tab, respecting quotes
                // Regex matches delimiters that are NOT inside quotes
                const cells = r.split(/[,;|\t](?=(?:(?:[^"]*"){2})*[^"]*$)/); 
                
                // Clean up quotes (remove outer quotes, unescape double quotes)
                const cleanedCells = cells.map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                sheet.addRow(cleanedCells);
            }
        });
    } else {
         await workbook.xlsx.load(buffer);
    }
    
    // Get first worksheet
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const jsonData: any[] = [];
    
    // Iterate over rows starting from 2 (assuming header is 1)
    // ExcelJS rows are 1-based.
    // We need to map headers first.
    let headers: string[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        // Capture headers
        row.eachCell((cell, colNumber) => {
          headers[colNumber] = normalizeHeader(String(cell.value));
        });
      } else {
        // Capture data
        const rowData: any = {};
        // Initialize all known headers to null/empty
        headers.forEach(h => { if(h) rowData[h] = ''; });

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
             let val = cell.value;
             if (typeof val === 'object' && val !== null && 'text' in val) {
                 val = (val as any).text; 
             } else if (typeof val === 'object' && val !== null && 'result' in val) {
                 val = (val as any).result;
             }
             rowData[header] = val;
          }
        });
        jsonData.push(rowData);
      }
    });

    return jsonData;
  };

  const handleImport = async () => {
    if (!previewData.length) return;
    setIsProcessing(true);
    setError(null);

    try {
      if (activeTab === 'paddler') {
        await onImportPaddlers(previewData);
      } else {
        await onImportEvents(previewData);
      }
      setSuccess(t('importSuccess') || 'Import successful');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setFile(null);
        setPreviewData([]);
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('importError') || 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template');
    const helpSheet = workbook.addWorksheet('Help - Hilfe');
    
    let fileName = 'template.xlsx';

    if (activeTab === 'paddler') {
      fileName = 'paddler_template.xlsx';
      
      // Template Data
      sheet.columns = [
        { header: 'Name', key: 'Name', width: 20 },
        { header: 'Weight', key: 'Weight', width: 10 },
        { header: 'Side', key: 'Side', width: 20 },
        { header: 'Email', key: 'Email', width: 30 },
      ];
      
      sheet.addRow({ Name: 'Max Mustermann', Weight: 85.5, Side: 'left', Email: 'max@example.com' });
      sheet.addRow({ Name: 'Erika Musterfrau', Weight: 65.0, Side: 'right', Email: 'erika@example.com' });
      sheet.addRow({ Name: 'Tom Trommler', Weight: 60.0, Side: 'drum', Email: 'tom@example.com' });
      sheet.addRow({ Name: 'Multi Talent', Weight: 72.5, Side: 'right, drum, steer', Email: 'multi@example.com' });

      // Help Data
      helpSheet.columns = [
        { header: 'Column', key: 'Column', width: 15 },
        { header: 'Description (DE)', key: 'DescriptionDE', width: 50 },
        { header: 'Description (EN)', key: 'DescriptionEN', width: 50 },
      ];
      
      helpSheet.addRows([
        { Column: 'Name', DescriptionDE: 'Vor- und Nachname des Paddlers', DescriptionEN: 'Full name of the paddler' },
        { Column: 'Weight', DescriptionDE: 'Gewicht in kg (z.B. 85.5)', DescriptionEN: 'Weight in kg (e.g. 85.5)' },
        { Column: 'Side', DescriptionDE: 'Rolle/Seite: "left", "right", "drum", "steer" (kommagetrennt für mehrere)', DescriptionEN: 'Role/Side: "left", "right", "drum", "steer" (comma separated for multiple)' },
        { Column: 'Email', DescriptionDE: 'E-Mail Adresse für Einladungen (optional)', DescriptionEN: 'Email address for invitations (optional)' }
      ]);
      
    } else {
      fileName = 'event_template.xlsx';
      
      // Template Data
      sheet.columns = [
        { header: 'Title', key: 'Title', width: 25 },
        { header: 'Date', key: 'Date', width: 15 },
        { header: 'Time', key: 'Time', width: 10 },
        { header: 'Type', key: 'Type', width: 15 },
        { header: 'BoatSize', key: 'BoatSize', width: 15 },
        { header: 'Comment', key: 'Comment', width: 30 },
      ];

      sheet.addRow({ Title: 'Training Dienstag', Date: '2025-05-20', Time: '19:00', Type: 'training', BoatSize: 'standard', Comment: 'Normales Training' });
      sheet.addRow({ Title: 'Regatta Hamburg', Date: '2025-06-15', Time: '09:00', Type: 'regatta', BoatSize: 'standard', Comment: 'Bitte pünktlich sein' });

      // Help Data
      helpSheet.columns = [
        { header: 'Column', key: 'Column', width: 15 },
        { header: 'Description (DE)', key: 'DescriptionDE', width: 50 },
        { header: 'Description (EN)', key: 'DescriptionEN', width: 50 },
      ];
      
      helpSheet.addRows([
         { Column: 'Title', DescriptionDE: 'Name des Termins', DescriptionEN: 'Name of the event' },
        { Column: 'Date', DescriptionDE: 'Datum (z.B. 2025-05-20 oder 20.05.2025)', DescriptionEN: 'Date (e.g. 2025-05-20 or 20.05.2025)' },
        { Column: 'Time', DescriptionDE: 'Uhrzeit (HH:MM)', DescriptionEN: 'Time (HH:MM)' },
        { Column: 'Type', DescriptionDE: 'Art: "training" oder "regatta"', DescriptionEN: 'Type: "training" or "regatta"' },
        { Column: 'BoatSize', DescriptionDE: 'Bootsklasse: "standard" (20) oder "small" (10)', DescriptionEN: 'Boat class: "standard" (20) or "small" (10)' },
        { Column: 'Comment', DescriptionDE: 'Optionaler Kommentar / Notiz', DescriptionEN: 'Optional comment / note' }
      ]);
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Create download link
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileUp className="text-blue-600 dark:text-blue-400" />
            {t('importData') || 'Import Data'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setActiveTab('paddler'); setFile(null); setPreviewData([]); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'paddler' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {t('paddlers') || 'Paddlers'}
          </button>
          <button
            onClick={() => { setActiveTab('event'); setFile(null); setPreviewData([]); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'event' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            {t('events') || 'Events'}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm flex items-center gap-2 border border-green-100 dark:border-green-900/30">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {/* Upload Area */}
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-900/50'
              }`}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileSelect} 
                className="hidden" 
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {t('dragDropOrClick') || 'Click to upload or drag and drop'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {t('supportedFormats') || 'Supports .xlsx, .xls, .csv'}
                </p>
                
                {/* Format Hint */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-xs text-left w-full max-w-sm">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{t('preview') || 'Expected Format'}:</p>
                    <button 
                      onClick={(e) => { e.preventDefault(); handleDownloadTemplate(); }}
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Download size={12} />
                      {t('downloadTemplate') || 'Template'}
                    </button>
                  </div>
                  {activeTab === 'paddler' ? (
                    <code className="block text-slate-600 dark:text-slate-400 font-mono">
                      {t('paddlerTemplateColumns') || 'Name | Weight | Side | Skills | Email'}
                    </code>
                  ) : (
                    <code className="block text-slate-600 dark:text-slate-400 font-mono">
                      {t('eventTemplateColumns') || 'Title | Date | Time | Type | BoatSize | Comment'}
                    </code>
                  )}
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                    <FileUp size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • {previewData.length} {t('rowsFound')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPreviewData([]); }}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preview Table */}
              {previewData.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col max-h-[50vh]">
                  <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('preview')} ({previewData.length} Items)</h4>
                  </div>
                  <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left relative">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium sticky top-0 z-10 shadow-sm">
                        <tr>
                          {Object.keys(previewData[0] || {}).map((key) => {
                            // Map canonical keys to translation keys
                            const translationMap: { [key: string]: string } = {
                              title: 'title',
                              date: 'date',
                              time: 'time',
                              type: 'type',
                              boatSize: 'boatSize',
                              comment: 'comment',
                              name: 'name',
                              weight: 'weight',
                              side: 'skills',
                              email: 'emailAddress',
                              skills: 'skills',
                            };
                            const translationKey = translationMap[key];
                            const displayName = translationKey ? (t(translationKey) || key) : key;
                            return (
                              <th key={key} className="px-3 py-2 whitespace-nowrap bg-slate-50 dark:bg-slate-900 capitalize">{displayName}</th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button 
            onClick={handleImport}
            disabled={!file || !previewData.length || isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} />
                {t('importButton')} {previewData.length} Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
