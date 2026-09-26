import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import FileList from './FileList';
import { initialContractDocuments } from '../data/contractProfile';
import { downloadDataUrl, generateDownload } from '../utils/download';

const tabs = [
  { id: 'unsigned', label: 'Unsigned' },
  { id: 'signed', label: 'Signed' },
];

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Right-hand slide-over: role="dialog", focus trap, Escape to close, focus restored on close */
function SignedLettersPanel({ onClose, onShowToast }) {
  const [activeTab, setActiveTab] = useState('unsigned');
  const [documents, setDocuments] = useState(initialContractDocuments);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    closeButtonRef.current?.focus();
    return () => previouslyFocused.current?.focus?.();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleUpload = (tabKey, files) => {
    const newDocs = files.map((file, index) => ({
      id: `UPLOAD-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      uploadedAt: todayLabel(),
      blobUrl: URL.createObjectURL(file),
    }));
    setDocuments((current) => ({ ...current, [tabKey]: [...newDocs, ...current[tabKey]] }));
    onShowToast(`${files.length} file${files.length === 1 ? '' : 's'} uploaded to ${tabKey === 'signed' ? 'Signed' : 'Unsigned'}`);
  };

  const handleView = (doc) => {
    if (doc.blobUrl) {
      window.open(doc.blobUrl, '_blank', 'noopener');
      return;
    }
    onShowToast(`Preview unavailable for sample document "${doc.name}"`);
  };

  const handleDownload = (doc) => {
    if (doc.blobUrl) {
      downloadDataUrl(doc.name, doc.blobUrl);
      return;
    }
    generateDownload(doc.name, `Sample document placeholder\n${doc.name}`, 'application/pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close document manager" onClick={onClose} className="absolute inset-0 bg-slate-950/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signed-letters-title"
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Document Management</p>
            <h2 id="signed-letters-title" className="mt-1 text-xl font-semibold text-slate-900">Signed Letters</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close document manager"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="Document status" className="flex gap-1 border-b border-slate-200 px-6">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`letters-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`letters-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  selected ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tabs.map((tab) => (
            <div key={tab.id} role="tabpanel" id={`letters-panel-${tab.id}`} aria-labelledby={`letters-tab-${tab.id}`} hidden={activeTab !== tab.id}>
              <FileList
                tabLabel={tab.label}
                documents={documents[tab.id]}
                onUploadFiles={(files) => handleUpload(tab.id, files)}
                onView={handleView}
                onDownload={handleDownload}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SignedLettersPanel;
