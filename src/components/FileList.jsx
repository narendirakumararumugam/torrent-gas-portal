import React, { useRef } from 'react';
import { Download, Eye, FileText, Upload } from 'lucide-react';

/* Reusable upload + list widget - supports an unlimited number of files per tab */
function FileList({ tabLabel, documents, onUploadFiles, onView, onDownload }) {
  const inputRef = useRef(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{documents.length} file{documents.length === 1 ? '' : 's'}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Upload Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          aria-label={`Upload files to ${tabLabel}`}
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (files.length) onUploadFiles(files);
            event.target.value = '';
          }}
        />
      </div>

      <ul className="mt-3 space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
                <p className="text-xs text-slate-400">{doc.size} • Uploaded {doc.uploadedAt}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => onView(doc)}
                aria-label={`View ${doc.name}`}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                View
              </button>
              <button
                type="button"
                onClick={() => onDownload(doc)}
                aria-label={`Download ${doc.name}`}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download
              </button>
            </div>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
            No documents yet. Use "Upload Files" to add some.
          </li>
        )}
      </ul>
    </div>
  );
}

export default FileList;
