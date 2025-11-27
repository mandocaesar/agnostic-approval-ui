"use client";

import { useState, useEffect, useCallback } from "react";
import type { Domain, Subdomain, DomainConnectivity } from "@/types";
import { Sheet } from "@/components/ui/sheet";
import {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  createSubdomain,
  updateSubdomain,
  deleteSubdomain,
} from "@/app/actions/domains";

interface ConnectivityFormProps {
  connectivity?: DomainConnectivity;
  onChange: (connectivity: DomainConnectivity) => void;
  level: "domain" | "subdomain";
}

function ConnectivityForm({ connectivity, onChange }: ConnectivityFormProps) {
  const [enableWebhook, setEnableWebhook] = useState(
    connectivity?.webhook?.enabled ?? false
  );
  const [enableKafka, setEnableKafka] = useState(
    connectivity?.kafka?.enabled ?? false
  );

  return (
    <div className="space-y-6">
      {/* Webhook Configuration */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Webhook Integration</h4>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableWebhook}
              onChange={(e) => {
                setEnableWebhook(e.target.checked);
                onChange({
                  ...connectivity,
                  webhook: {
                    enabled: e.target.checked,
                    url: connectivity?.webhook?.url || "",
                    method: connectivity?.webhook?.method || "POST",
                    headers: connectivity?.webhook?.headers,
                    secret: connectivity?.webhook?.secret,
                  },
                });
              }}
              className="rounded border-slate-300 text-[#0d1d3b] focus:ring-[#0d1d3b]"
            />
            <span className="text-sm font-medium text-slate-700">Enable</span>
          </label>
        </div>

        {enableWebhook && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Webhook URL *
              </label>
              <input
                type="url"
                value={connectivity?.webhook?.url || ""}
                onChange={(e) =>
                  onChange({
                    ...connectivity,
                    webhook: {
                      enabled: true,
                      method: connectivity?.webhook?.method || "POST",
                      headers: connectivity?.webhook?.headers,
                      secret: connectivity?.webhook?.secret,
                      url: e.target.value,
                    },
                  })
                }
                placeholder="https://api.example.com/webhooks/approval"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#0d1d3b] focus:outline-none focus:ring-1 focus:ring-[#0d1d3b]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                HTTP Method
              </label>
              <select
                value={connectivity?.webhook?.method || "POST"}
                onChange={(e) =>
                  onChange({
                    ...connectivity,
                    webhook: {
                      enabled: true,
                      url: connectivity?.webhook?.url || "",
                      headers: connectivity?.webhook?.headers,
                      secret: connectivity?.webhook?.secret,
                      method: e.target.value as "POST" | "PUT" | "PATCH",
                    },
                  })
                }
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#0d1d3b] focus:outline-none focus:ring-1 focus:ring-[#0d1d3b]"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Secret Key (for HMAC signatures)
              </label>
              <input
                type="password"
                value={connectivity?.webhook?.secret || ""}
                onChange={(e) =>
                  onChange({
                    ...connectivity,
                    webhook: {
                      enabled: true,
                      url: connectivity?.webhook?.url || "",
                      method: connectivity?.webhook?.method || "POST",
                      headers: connectivity?.webhook?.headers,
                      secret: e.target.value,
                    },
                  })
                }
                placeholder="Optional: Enter secret for signing"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#0d1d3b] focus:outline-none focus:ring-1 focus:ring-[#0d1d3b]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Kafka Configuration */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Kafka Integration</h4>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableKafka}
              onChange={(e) => {
                setEnableKafka(e.target.checked);
                onChange({
                  ...connectivity,
                  kafka: {
                    enabled: e.target.checked,
                    topic: connectivity?.kafka?.topic || "",
                    brokers: connectivity?.kafka?.brokers,
                  },
                });
              }}
              className="rounded border-slate-300 text-[#0d1d3b] focus:ring-[#0d1d3b]"
            />
            <span className="text-sm font-medium text-slate-700">Enable</span>
          </label>
        </div>

        {enableKafka && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Kafka Topic *
              </label>
              <input
                type="text"
                value={connectivity?.kafka?.topic || ""}
                onChange={(e) =>
                  onChange({
                    ...connectivity,
                    kafka: {
                      enabled: true,
                      brokers: connectivity?.kafka?.brokers,
                      topic: e.target.value,
                    },
                  })
                }
                placeholder="approval.events.{level}.{{domainId}}"
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-[#0d1d3b] focus:outline-none focus:ring-1 focus:ring-[#0d1d3b]"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use {"{domainId}"} or {"{subdomainId}"} for dynamic topics
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [showSubdomainForm, setShowSubdomainForm] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);

  const [domainForm, setDomainForm] = useState({
    name: "",
    description: "",
    tags: "",
  });

  const [subdomainForm, setSubdomainForm] = useState({
    name: "",
    description: "",
    tags: "",
  });

  const loadDomains = useCallback(async () => {
    try {
      const data = await getDomains();
      setDomains(data);
      // Update selected domain if it exists
      if (selectedDomain) {
        const updated = data.find(d => d.id === selectedDomain.id);
        if (updated) setSelectedDomain(updated);
      }
    } catch (error) {
      console.error("Failed to load domains:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsSheetOpen(true);
  };

  const handleCreateDomain = async () => {
    if (!domainForm.name.trim()) return;
    try {
      const tags = domainForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await createDomain(domainForm.name, domainForm.description, tags);
      await loadDomains();
      setDomainForm({ name: "", description: "", tags: "" });
      setShowDomainForm(false);
    } catch (error) {
      console.error("Failed to create domain:", error);
    }
  };

  const handleUpdateDomainConnectivity = async (connectivity: DomainConnectivity) => {
    if (!selectedDomain) return;
    try {
      await updateDomain(selectedDomain.id, { connectivity });
      await loadDomains();
    } catch (error) {
      console.error("Failed to update domain:", error);
    }
  };

  const handleCreateSubdomain = async () => {
    if (!selectedDomain || !subdomainForm.name.trim()) return;
    try {
      const tags = subdomainForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
      await createSubdomain(selectedDomain.id, subdomainForm.name, subdomainForm.description, tags);
      await loadDomains();
      setSubdomainForm({ name: "", description: "", tags: "" });
      setShowSubdomainForm(false);
    } catch (error) {
      console.error("Failed to create subdomain:", error);
    }
  };

  const handleUpdateSubdomainConnectivity = async (subdomainId: string, connectivity: DomainConnectivity) => {
    if (!selectedDomain) return;
    try {
      await updateSubdomain(selectedDomain.id, subdomainId, { connectivity });
      await loadDomains();
    } catch (error) {
      console.error("Failed to update subdomain:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#0d1d3b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Domain Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage domains, subdomains, and connectivity configurations
          </p>
        </div>
        <button
          onClick={() => setShowDomainForm(true)}
          className="rounded-lg bg-[#0d1d3b] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#132a52]"
        >
          + Add Domain
        </button>
      </div>

      {/* Add Domain Form */}
      {showDomainForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            New Domain
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Domain Name *
              </label>
              <input
                type="text"
                value={domainForm.name}
                onChange={(e) =>
                  setDomainForm({ ...domainForm, name: e.target.value })
                }
                placeholder="e.g., Payment, HR, Inventory"
                className="w-full rounded border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={domainForm.description}
                onChange={(e) =>
                  setDomainForm({ ...domainForm, description: e.target.value })
                }
                placeholder="Brief description of this domain"
                className="w-full rounded border border-slate-200 px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={domainForm.tags}
                onChange={(e) =>
                  setDomainForm({ ...domainForm, tags: e.target.value })
                }
                placeholder="finance, critical, production"
                className="w-full rounded border border-slate-200 px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateDomain}
                disabled={!domainForm.name.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                Save Domain
              </button>
              <button
                onClick={() => {
                  setShowDomainForm(false);
                  setDomainForm({ name: "", description: "", tags: "" });
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domains Table */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Registered Domains
            </h2>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {domains.length} total
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-lg items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all focus-within:border-[#0d1d3b] focus-within:ring-2 focus-within:ring-[#0d1d3b]/10">
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
                placeholder="Search domains..."
                className="w-full border-none bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                Filter
              </button>
            </div>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-500">Domain Name</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Description</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Subdomains</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Active Approvals</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Tags</th>
                <th className="px-6 py-3 font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.map((domain) => (
                <tr
                  key={domain.id}
                  onClick={() => handleDomainClick(domain)}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 group-hover:text-[#0d1d3b]">
                      {domain.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-slate-600">
                      {domain.description || "No description"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900">{domain.subdomains.length}</div>
                  </td>
                  <td className="px-6 py-4">
                    {domain.activeApprovalCount !== undefined && domain.activeApprovalCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        {domain.activeApprovalCount} active
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {domain.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {domain.tags && domain.tags.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          +{domain.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDomainClick(domain);
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        Configure
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this domain?")) {
                            deleteDomain(domain.id).then(loadDomains);
                          }
                        }}
                        className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {domains.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No domains registered yet. Create your first domain to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Configuration Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={selectedDomain?.name}
        description="Configure domain settings, connectivity, and subdomains"
      >
        {selectedDomain && (
          <div className="space-y-8 pb-20">
            {/* Domain Connectivity */}
            <section>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                Domain Connectivity
              </h3>
              <ConnectivityForm
                connectivity={selectedDomain.connectivity}
                onChange={handleUpdateDomainConnectivity}
                level="domain"
              />
            </section>

            {/* Subdomains Section */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Subdomains
                </h3>
                <button
                  onClick={() => setShowSubdomainForm(!showSubdomainForm)}
                  className="text-sm font-medium text-[#0d1d3b] hover:underline"
                >
                  {showSubdomainForm ? "Cancel" : "+ Add Subdomain"}
                </button>
              </div>

              {showSubdomainForm && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={subdomainForm.name}
                      onChange={(e) => setSubdomainForm({ ...subdomainForm, name: e.target.value })}
                      placeholder="Subdomain Name"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={subdomainForm.description}
                      onChange={(e) => setSubdomainForm({ ...subdomainForm, description: e.target.value })}
                      placeholder="Description"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={subdomainForm.tags}
                      onChange={(e) => setSubdomainForm({ ...subdomainForm, tags: e.target.value })}
                      placeholder="Tags"
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleCreateSubdomain}
                      disabled={!subdomainForm.name.trim()}
                      className="w-full rounded bg-[#0d1d3b] py-2 text-sm font-medium text-white hover:bg-[#132a52] disabled:opacity-50"
                    >
                      Create Subdomain
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selectedDomain.subdomains.map((subdomain) => (
                  <div
                    key={subdomain.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{subdomain.name}</h4>
                        <p className="text-xs text-slate-600">{subdomain.description}</p>
                        {subdomain.activeApprovalCount !== undefined && (
                          <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            {subdomain.activeApprovalCount} active
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSubdomain(editingSubdomain?.id === subdomain.id ? null : subdomain)}
                          className="text-xs font-medium text-slate-600 hover:text-[#0d1d3b]"
                        >
                          {editingSubdomain?.id === subdomain.id ? "Done" : "Configure"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this subdomain?")) {
                              deleteSubdomain(selectedDomain.id, subdomain.id).then(loadDomains);
                            }
                          }}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingSubdomain?.id === subdomain.id && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <ConnectivityForm
                          connectivity={subdomain.connectivity}
                          onChange={(c) => handleUpdateSubdomainConnectivity(subdomain.id, c)}
                          level="subdomain"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {selectedDomain.subdomains.length === 0 && (
                  <p className="text-center text-sm text-slate-500">No subdomains yet</p>
                )}
              </div>
            </section>
          </div>
        )}
      </Sheet>
    </div>
  );
}
