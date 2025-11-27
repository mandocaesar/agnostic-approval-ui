"use client";

import { useState } from "react";

interface FlowVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  definition: any;
  metadata: any;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

interface VersionHistoryProps {
  flowId: string;
  currentVersion: string;
  onRestore: (versionId: string) => void;
}

export function VersionHistory({ flowId, currentVersion, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadVersions();
  };

  const handleRestore = async (versionId: string) => {
    try {
      const response = await fetch(`/api/flows/${flowId}/versions/${versionId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        onRestore(versionId);
        setRestoreConfirm(null);
        setIsOpen(false);
      } else {
        alert('Failed to restore version');
      }
    } catch (error) {
      console.error("Failed to restore version:", error);
      alert('Error restoring version');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
      >
        📜 Version History
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Version History
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Flow Versions (Current: {currentVersion})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-500">Loading versions...</div>
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg font-medium text-slate-700">No version history yet</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Version history will be created when you save changes to this flow
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`rounded-lg border p-4 transition ${
                        version.isActive
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              version.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              v{version.version}
                            </span>
                            {version.isActive && (
                              <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                                ACTIVE
                              </span>
                            )}
                            <h4 className="font-semibold text-slate-900">{version.name}</h4>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{version.description}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Saved on {formatDate(version.createdAt)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Stages: {version.definition?.stages?.length || 0}
                          </p>
                        </div>
                        {!version.isActive && (
                          <button
                            onClick={() => setRestoreConfirm(version.id)}
                            className="ml-4 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-600"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setRestoreConfirm(null)}
        >
          <div
            className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Confirm Restore</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to restore this version? This will make it the active version without creating a duplicate.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRestoreConfirm(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestore(restoreConfirm)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Restore Version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
