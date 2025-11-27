"use client";

import { useState } from "react";
import type { Domain, Subdomain, DomainConnectivity } from "@/types";

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface ConnectivityFormProps {
    connectivity?: DomainConnectivity;
    onChange: (connectivity: DomainConnectivity) => void;
    level: "domain" | "subdomain";
}

function ConnectivityForm({ connectivity, onChange, level }: ConnectivityFormProps) {
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
                                        ...connectivity?.webhook,
                                        enabled: e.target.checked,
                                        url: connectivity?.webhook?.url || "",
                                    },
                                });
                            }}
                            className="rounded border-slate-300"
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
                                            ...connectivity?.webhook!,
                                            url: e.target.value,
                                        },
                                    })
                                }
                                placeholder="https://api.example.com/webhooks/approval"
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
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
                                            ...connectivity?.webhook!,
                                            method: e.target.value as "POST" | "PUT" | "PATCH",
                                        },
                                    })
                                }
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
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
                                            ...connectivity?.webhook!,
                                            secret: e.target.value,
                                        },
                                    })
                                }
                                placeholder="Optional: Enter secret for signing"
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
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
                                        ...connectivity?.kafka,
                                        enabled: e.target.checked,
                                        topic: connectivity?.kafka?.topic || "",
                                    },
                                });
                            }}
                            className="rounded border-slate-300"
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
                                            ...connectivity?.kafka!,
                                            topic: e.target.value,
                                        },
                                    })
                                }
                                placeholder="approval.events.{level}.{{domainId}}"
                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Use {{`{domainId}`}} or {{`{subdomainId}`}} for dynamic topics
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
    const [showDomainForm, setShowDomainForm] = useState(false);
    const [showSubdomainForm, setShowSubdomainForm] = useState<string | null>(null);
    const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
    const [editingSubdomain, setEditingSubdomain] = useState<{
        domain: Domain;
        subdomain: Subdomain;
    } | null>(null);

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

    const saveDomain = () => {
        if (!domainForm.name.trim()) return;

        const newDomain: Domain = {
            id: generateId(),
            name: domainForm.name,
            description: domainForm.description,
            subdomains: [],
            tags: domainForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setDomains([...domains, newDomain]);
        setDomainForm({ name: "", description: "", tags: "" });
        setShowDomainForm(false);
    };

    const saveSubdomain = (domainId: string) => {
        if (!subdomainForm.name.trim()) return;

        const newSubdomain: Subdomain = {
            id: generateId(),
            name: subdomainForm.name,
            description: subdomainForm.description,
            flows: [],
            tags: subdomainForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setDomains(
            domains.map((d) =>
                d.id === domainId
                    ? {
                        ...d,
                        subdomains: [...d.subdomains, newSubdomain],
                        updatedAt: new Date().toISOString(),
                    }
                    : d
            )
        );

        setSubdomainForm({ name: "", description: "", tags: "" });
        setShowSubdomainForm(null);
    };

    const updateDomainConnectivity = (
        domainId: string,
        connectivity: DomainConnectivity
    ) => {
        setDomains(
            domains.map((d) =>
                d.id === domainId
                    ? { ...d, connectivity, updatedAt: new Date().toISOString() }
                    : d
            )
        );
    };

    const updateSubdomainConnectivity = (
        domainId: string,
        subdomainId: string,
        connectivity: DomainConnectivity
    ) => {
        setDomains(
            domains.map((d) =>
                d.id === domainId
                    ? {
                        ...d,
                        subdomains: d.subdomains.map((s) =>
                            s.id === subdomainId
                                ? { ...s, connectivity, updatedAt: new Date().toISOString() }
                                : s
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : d
            )
        );
    };

    const deleteDomain = (domainId: string) => {
        if (confirm("Are you sure you want to delete this domain?")) {
            setDomains(domains.filter((d) => d.id !== domainId));
        }
    };

    const deleteSubdomain = (domainId: string, subdomainId: string) => {
        if (confirm("Are you sure you want to delete this subdomain?")) {
            setDomains(
                domains.map((d) =>
                    d.id === domainId
                        ? {
                            ...d,
                            subdomains: d.subdomains.filter((s) => s.id !== subdomainId),
                            updatedAt: new Date().toISOString(),
                        }
                        : d
                )
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Domain Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Register and configure domains, subdomains, and their connectivity
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
                                onClick={saveDomain}
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

            {/* Domains List */}
            {domains.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                    <p className="text-sm text-slate-600">
                        No domains registered yet. Create your first domain to get started.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {domains.map((domain) => (
                        <div
                            key={domain.id}
                            className="rounded-lg border border-slate-200 bg-white shadow-sm"
                        >
                            {/* Domain Header */}
                            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {domain.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {domain.description || "No description"}
                                        </p>
                                        {domain.tags && domain.tags.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {domain.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingDomain(domain)}
                                            className="text-sm text-slate-600 hover:text-[#0d1d3b]"
                                        >
                                            Configure
                                        </button>
                                        <button
                                            onClick={() => deleteDomain(domain.id)}
                                            className="text-sm text-rose-600 hover:text-rose-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Domain Connectivity */}
                            {editingDomain?.id === domain.id && (
                                <div className="border-b border-slate-100 bg-white px-6 py-4">
                                    <h4 className="mb-4 text-sm font-semibold text-slate-900">
                                        Domain Connectivity Configuration
                                    </h4>
                                    <ConnectivityForm
                                        connectivity={domain.connectivity}
                                        onChange={(connectivity) =>
                                            updateDomainConnectivity(domain.id, connectivity)
                                        }
                                        level="domain"
                                    />
                                    <button
                                        onClick={() => setEditingDomain(null)}
                                        className="mt-4 text-sm text-slate-600 hover:text-slate-900"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {/* Subdomains */}
                            <div className="px-6 py-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-700">
                                        Subdomains ({domain.subdomains.length})
                                    </h4>
                                    <button
                                        onClick={() => setShowSubdomainForm(domain.id)}
                                        className="text-sm text-[#0d1d3b] hover:text-[#132a52]"
                                    >
                                        + Add Subdomain
                                    </button>
                                </div>

                                {showSubdomainForm === domain.id && (
                                    <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-900">
                                            New Subdomain
                                        </h5>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={subdomainForm.name}
                                                onChange={(e) =>
                                                    setSubdomainForm({
                                                        ...subdomainForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Subdomain name (e.g., QR, VA, AD)"
                                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                                            />
                                            <textarea
                                                value={subdomainForm.description}
                                                onChange={(e) =>
                                                    setSubdomainForm({
                                                        ...subdomainForm,
                                                        description: e.target.value,
                                                    })
                                                }
                                                placeholder="Description"
                                                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveSubdomain(domain.id)}
                                                    disabled={!subdomainForm.name.trim()}
                                                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowSubdomainForm(null);
                                                        setSubdomainForm({
                                                            name: "",
                                                            description: "",
                                                            tags: "",
                                                        });
                                                    }}
                                                    className="rounded border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {domain.subdomains.map((subdomain) => (
                                        <div
                                            key={subdomain.id}
                                            className="rounded border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h5 className="font-medium text-slate-900">
                                                        {subdomain.name}
                                                    </h5>
                                                    <p className="text-xs text-slate-600">
                                                        {subdomain.description || "No description"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditingSubdomain({ domain, subdomain })
                                                        }
                                                        className="text-xs text-slate-600 hover:text-[#0d1d3b]"
                                                    >
                                                        Configure
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteSubdomain(domain.id, subdomain.id)
                                                        }
                                                        className="text-xs text-rose-600 hover:text-rose-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>

                                            {editingSubdomain?.subdomain.id === subdomain.id && (
                                                <div className="mt-4">
                                                    <h6 className="mb-3 text-xs font-semibold text-slate-900">
                                                        Subdomain Connectivity (overrides domain settings)
                                                    </h6>
                                                    <ConnectivityForm
                                                        connectivity={subdomain.connectivity}
                                                        onChange={(connectivity) =>
                                                            updateSubdomainConnectivity(
                                                                domain.id,
                                                                subdomain.id,
                                                                connectivity
                                                            )
                                                        }
                                                        level="subdomain"
                                                    />
                                                    <button
                                                        onClick={() => setEditingSubdomain(null)}
                                                        className="mt-3 text-xs text-slate-600 hover:text-slate-900"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {domain.subdomains.length === 0 && (
                                        <p className="py-4 text-center text-sm text-slate-500">
                                            No subdomains yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
