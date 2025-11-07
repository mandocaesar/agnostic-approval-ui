"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface RuleCatalogEntry {
  id: string;
  name: string;
  description: string;
  domainLabel: string;
  subdomainLabel: string;
  version: string;
  stageCount: number;
  notificationCount: number;
  updatedAt: string;
}

interface RuleCatalogTableProps {
  entries: RuleCatalogEntry[];
}

const PAGE_SIZE = 6;

export function RuleCatalogTable({ entries }: RuleCatalogTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<RuleCatalogEntry | null>(
    null,
  );

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }
    const term = searchTerm.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.domainLabel.toLowerCase().includes(term) ||
        entry.subdomainLabel.toLowerCase().includes(term),
    );
  }, [entries, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedEntries = filteredEntries.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );
  const startEntry =
    paginatedEntries.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endEntry =
    paginatedEntries.length === 0
      ? 0
      : currentPage * PAGE_SIZE + paginatedEntries.length;

  const closeModal = () => setPendingDelete(null);
  const confirmDelete = () => {
    setPendingDelete(null);
  };

  const goToPage = (index: number) => {
    setPageIndex(Math.max(0, Math.min(totalPages - 1, index)));
  };
  const visiblePages = useMemo(() => {
    const range = 3;
    let start = Math.max(0, currentPage - 1);
    const end = Math.min(totalPages - 1, start + range - 1);
    const shortBy = range - (end - start + 1);
    start = Math.max(0, start - shortBy);
    const pages: number[] = [];
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <svg
            className="h-4 w-4 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m15.5 15.5-3.4-3.4a4.5 4.5 0 1 0-6.36-6.36 4.5 4.5 0 0 0 6.36 6.36l3.4 3.4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="search"
            placeholder="Search by name, domain, or subdomain"
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPageIndex(0);
            }}
          />
        </div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {filteredEntries.length} result(s)
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Flow</th>
              <th className="px-6 py-3 font-semibold">Domain · Subdomain</th>
              <th className="px-6 py-3 font-semibold">Version</th>
              <th className="px-6 py-3 font-semibold">Stages</th>
              <th className="px-6 py-3 font-semibold">Notifications</th>
              <th className="px-6 py-3 font-semibold">Updated</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {entry.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {entry.description}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-800">
                    {entry.domainLabel}
                  </div>
                  <div className="text-xs text-slate-500">
                    {entry.subdomainLabel}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {entry.version}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {entry.stageCount}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {entry.notificationCount} stage(s)
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {entry.updatedAt}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/dashboard/rules/new?flowId=${entry.id}`}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-600"
                      aria-label={`Edit ${entry.name}`}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4.167 12.917V15.833h2.916L15 7.917 12.083 5l-7.916 7.917Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(entry)}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                      aria-label={`Delete ${entry.name}`}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M4.167 5.833h11.666M7.5 5.833V4.167h5V5.833M8.333 9.167v5M11.667 9.167v5M5.833 5.833v10c0 .23.092.451.256.614.163.164.385.256.614.256h6.594c.23 0 .451-.092.614-.256.164-.163.256-.384.256-.614v-10"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedEntries.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-sm text-slate-500"
                  colSpan={7}
                >
                  No approval flows matched your search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Menampilkan {startEntry} sampai {endEntry} dari {filteredEntries.length} baris
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            disabled={currentPage === 0}
          >
            «
          </button>
          {visiblePages.map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => goToPage(page)}
              className={[
                "flex h-8 min-w-[2rem] items-center justify-center border bg-white text-sm font-medium",
                page === currentPage
                  ? "border-[#0d1d3b] text-[#0d1d3b]"
                  : "border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600",
              ].join(" ")}
            >
              {page + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            disabled={currentPage >= totalPages - 1}
          >
            »
          </button>
        </div>
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Delete flow?
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                You&apos;re about to remove{" "}
                <span className="font-semibold text-slate-800">
                  {pendingDelete.name}
                </span>{" "}
                in {pendingDelete.domainLabel} · {pendingDelete.subdomainLabel}.
              </p>
            </header>
            <div className="space-y-3 px-5 py-5 text-sm text-slate-600">
              <p>
                This mock workspace does not persist deletions, but confirming
                will dismiss the dialog and represent the intended workflow.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-rose-500"
                >
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
