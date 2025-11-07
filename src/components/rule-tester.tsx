"use client";

import {
  Fragment,
  MouseEvent,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import type {
  ApprovalFlow,
  ApprovalFlowStage,
  ApprovalStatus,
  Domain,
  User,
} from "@/types";
import {
  evaluateFlowPath,
  validateFlowDefinition,
  type FlowPathEvaluation,
} from "@/lib/ruleEngine";
import {
  buildStageNotification,
  type StageNotificationPreview,
} from "@/lib/notificationEngine";

const FINAL_STATUSES: ApprovalStatus[] = ["approved", "reject"];

interface RuleTesterProps {
  domains: Domain[];
  users: User[];
}

interface PathConfig {
  start: ApprovalStatus;
  end: ApprovalStatus;
  transitionsJson: string;
}

function toPrettyArray(values: ApprovalStatus[]): string {
  if (values.length === 0) {
    return "[\n]";
  }
  return JSON.stringify(values, null, 2);
}

function getDefaultEndStatus(statuses: ApprovalStatus[]): ApprovalStatus {
  const finalCandidate = statuses.find((status) =>
    FINAL_STATUSES.includes(status),
  );
  return finalCandidate ?? statuses[statuses.length - 1] ?? "approved";
}

function buildDefaultPathConfig(flow: ApprovalFlow | undefined): PathConfig {
  if (!flow) {
    return {
      start: "draft",
      end: "approved",
      transitionsJson: "[\n]",
    };
  }

  const statuses = flow.definition.stages.map((stage) => stage.status);
  const start = statuses[0] ?? "draft";
  const end = getDefaultEndStatus(statuses);
  const startIndex = statuses.indexOf(start);
  const endIndex = statuses.lastIndexOf(end);
  const between =
    startIndex >= 0 && endIndex > startIndex
      ? statuses.slice(startIndex + 1, endIndex)
      : [];

  return {
    start,
    end,
    transitionsJson: toPrettyArray(between),
  };
}

export function RuleTester({ domains, users }: RuleTesterProps) {
  const [selectedDomainId, setSelectedDomainId] = useState(
    () => domains[0]?.id ?? "",
  );
  const [selectedSubdomainId, setSelectedSubdomainId] = useState(
    () => domains[0]?.subdomains[0]?.id ?? "",
  );
  const [selectedFlowId, setSelectedFlowId] = useState(
    () => domains[0]?.subdomains[0]?.flows[0]?.id ?? "",
  );

  const selectedDomain = domains.find(
    (domain) => domain.id === selectedDomainId,
  );
  const selectedSubdomain = selectedDomain?.subdomains.find(
    (subdomain) => subdomain.id === selectedSubdomainId,
  );
  const selectedFlow = selectedSubdomain?.flows.find(
    (flow) => flow.id === selectedFlowId,
  );

  const defaultPathConfig = useMemo(
    () => buildDefaultPathConfig(selectedFlow),
    [selectedFlow],
  );

  const [definitionJson, setDefinitionJson] = useState(() =>
    selectedFlow
      ? JSON.stringify(selectedFlow.definition, null, 2)
      : "{\n  \"stages\": []\n}",
  );
  const [startStatus, setStartStatus] = useState<ApprovalStatus>(
    defaultPathConfig.start,
  );
  const [endStatus, setEndStatus] = useState<ApprovalStatus>(
    defaultPathConfig.end,
  );
  const [transitionsJson, setTransitionsJson] = useState(
    defaultPathConfig.transitionsJson,
  );
  const [evaluation, setEvaluation] = useState<FlowPathEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const allStatuses = useMemo(() => {
    if (!selectedFlow) {
      return FINAL_STATUSES;
    }
    const unique = Array.from(
      new Set(selectedFlow.definition.stages.map((stage) => stage.status)),
    );
    return unique;
  }, [selectedFlow]);

  const stageNotificationsById = useMemo(() => {
    if (!selectedDomain || !selectedSubdomain || !selectedFlow) {
      return {} as Record<string, StageNotificationPreview | null>;
    }
    const context = {
      flow: selectedFlow,
      domain: selectedDomain,
      subdomain: selectedSubdomain,
      users,
    };
    return selectedFlow.definition.stages.reduce<
      Record<string, StageNotificationPreview | null>
    >((acc, stage) => {
      acc[stage.id] = buildStageNotification(stage, context);
      return acc;
    }, {});
  }, [selectedDomain, selectedSubdomain, selectedFlow, users]);

  const activeStage = useMemo<ApprovalFlowStage | null>(() => {
    if (!selectedFlow || !activeStageId) {
      return null;
    }
    return (
      selectedFlow.definition.stages.find((stage) => stage.id === activeStageId) ??
      null
    );
  }, [activeStageId, selectedFlow]);

  const activeStageNotification = activeStage
    ? stageNotificationsById[activeStage.id] ?? null
    : null;

  const applyFlowDefaults = (flow: ApprovalFlow | undefined) => {
    if (!flow) {
      setDefinitionJson("{\n  \"stages\": []\n}");
      setStartStatus("draft");
      setEndStatus("approved");
      setTransitionsJson("[\n]");
    } else {
      setDefinitionJson(JSON.stringify(flow.definition, null, 2));
      const pathConfig = buildDefaultPathConfig(flow);
      setStartStatus(pathConfig.start);
      setEndStatus(pathConfig.end);
      setTransitionsJson(pathConfig.transitionsJson);
    }
    setEvaluation(null);
    setError(null);
    setActiveStageId(null);
  };

  const handleDomainChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextDomainId = event.target.value;
    setSelectedDomainId(nextDomainId);

    const domain = domains.find((item) => item.id === nextDomainId);
    const nextSubdomainId = domain?.subdomains[0]?.id ?? "";
    const nextFlow = domain?.subdomains[0]?.flows[0];

    setSelectedSubdomainId(nextSubdomainId);
    setSelectedFlowId(nextFlow?.id ?? "");
    applyFlowDefaults(nextFlow);
  };

  const handleSubdomainChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextSubdomainId = event.target.value;
    setSelectedSubdomainId(nextSubdomainId);

    const subdomain = selectedDomain?.subdomains.find(
      (item) => item.id === nextSubdomainId,
    );
    const nextFlow = subdomain?.flows[0];
    setSelectedFlowId(nextFlow?.id ?? "");
    applyFlowDefaults(nextFlow);
  };

  const handleFlowChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextFlowId = event.target.value;
    setSelectedFlowId(nextFlowId);

    const flow = selectedSubdomain?.flows.find(
      (item) => item.id === nextFlowId,
    );
    applyFlowDefaults(flow);
  };

  const evaluate = () => {
    try {
      if (!selectedFlow) {
        setError("Select a flow before validating the path.");
        setEvaluation(null);
        return;
      }

      const parsedDefinition = JSON.parse(definitionJson);
      if (!validateFlowDefinition(parsedDefinition)) {
        setError("Flow JSON is not a valid approval flow definition.");
        setEvaluation(null);
        return;
      }

      const parsedTransitions = JSON.parse(transitionsJson);
      if (
        !Array.isArray(parsedTransitions) ||
        parsedTransitions.some((value) => typeof value !== "string")
      ) {
        setError("Transitions must be a JSON array of statuses.");
        setEvaluation(null);
        return;
      }

      const unknownStatuses = parsedTransitions.filter(
        (value): value is string =>
          typeof value === "string" &&
          !allStatuses.includes(value as ApprovalStatus),
      );

      if (
        !allStatuses.includes(startStatus) ||
        !allStatuses.includes(endStatus) ||
        unknownStatuses.length > 0
      ) {
        setError(
          `Statuses must exist in the selected flow. Available: ${allStatuses.join(", ")}.`,
        );
        setEvaluation(null);
        return;
      }

      const fullPath: ApprovalStatus[] = [
        startStatus,
        ...parsedTransitions,
        endStatus,
      ];

      if (!FINAL_STATUSES.includes(endStatus)) {
        setError(
          `End status "${endStatus}" is not marked as a final state. Choose one of: ${FINAL_STATUSES.join(", ")}.`,
        );
        setEvaluation(null);
        return;
      }

      const result = evaluateFlowPath(parsedDefinition, fullPath);
      setEvaluation(result);
      setError(null);
    } catch (err) {
      setEvaluation(null);
      setError(err instanceof Error ? err.message : "Unable to parse JSON.");
    }
  };

  const resetToDefinition = () => {
    applyFlowDefaults(selectedFlow);
  };

  const handleStageClick = (stageId: string) => {
    setActiveStageId(stageId);
  };

  const closeStageModal = () => {
    setActiveStageId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Domain
            </label>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedDomainId}
              onChange={handleDomainChange}
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subdomain
            </label>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedSubdomainId}
              onChange={handleSubdomainChange}
            >
              {selectedDomain?.subdomains.map((subdomain) => (
                <option key={subdomain.id} value={subdomain.id}>
                  {subdomain.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Flow
            </label>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={selectedFlowId}
              onChange={handleFlowChange}
            >
              {selectedSubdomain?.flows.map((flow) => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-6">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Stage map
                </h3>
                <p className="text-sm text-slate-500">
                  Visualise the journey across statuses. Final states are marked,
                  and transitions show possible next steps.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Edit Flow JSON
              </button>
            </div>

            <div className="relative">
              {selectedFlow ? (
                <div className="-mx-4 overflow-x-auto px-4 pb-2">
                  <div className="flex min-w-max items-center gap-0">
                    {selectedFlow.definition.stages.map((stage, index, array) => {
                      const stageNotification = stageNotificationsById[stage.id];
                      const isFinal = FINAL_STATUSES.includes(stage.status);
                      const isActive = activeStageId === stage.id;
                      const showsConnector = index < array.length - 1;

                      return (
                        <Fragment key={stage.id}>
                          <button
                            type="button"
                            onClick={() => handleStageClick(stage.id)}
                            className={[
                              "group relative flex min-h-[180px] min-w-[230px] max-w-[260px] flex-col rounded-2xl border px-4 py-3 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
                              isActive
                                ? "border-slate-900 ring-2 ring-slate-900/10"
                                : "border-slate-200 hover:border-slate-300",
                              isFinal
                                ? "bg-gradient-to-b from-emerald-50 via-white to-white"
                                : "bg-white",
                            ].join(" ")}
                            title="Click to view stage detail"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  Stage {index + 1}
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {stage.name}
                                </p>
                              </div>
                              <span
                                className={[
                                  "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                  isFinal
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600",
                                ].join(" ")}
                              >
                                {stage.status}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              {stage.description}
                            </p>
                            <div className="mt-4 space-y-2 text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Actor</span>
                                <span className="font-semibold text-slate-700">
                                  {stage.actor}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Next</span>
                                <span className="font-semibold text-slate-700">
                                  {stage.transitions.length > 0
                                    ? stage.transitions
                                        .map((transition) => transition.to)
                                        .join(", ")
                                    : "Terminal"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className={[
                                    "h-2.5 w-2.5 rounded-full",
                                    stageNotification
                                      ? "bg-emerald-500"
                                      : "bg-slate-300",
                                  ].join(" ")}
                                />
                                {stageNotification ? "Notifies" : "Silent"}
                              </span>
                              <span className="text-slate-500 group-hover:text-slate-900">
                                View detail
                              </span>
                            </div>
                          </button>
                          {showsConnector ? (
                            <div className="flex items-center px-3">
                              <span className="h-px w-12 rounded-full bg-slate-200" />
                              <svg
                                className="h-4 w-4 text-slate-300"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M5 12h14m0 0-4-4m4 4-4 4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span className="h-px w-12 rounded-full bg-slate-200" />
                            </div>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  Select a flow to review its stage definition.
                </div>
              )}
        </div>
      </section>

      {activeStage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={closeStageModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stage-modal-title"
            className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <header className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Stage detail
                </p>
                <h2
                  id="stage-modal-title"
                  className="text-xl font-semibold text-slate-900"
                >
                  {activeStage.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {activeStage.description}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:justify-end">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    Status · {activeStage.status.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    Actor · {activeStage.actor}
                  </span>
                  {FINAL_STATUSES.includes(activeStage.status) ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                      Final state
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeStageModal}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </header>
            <div className="divide-y divide-slate-100">
              <section className="px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Metadata
                </h3>
                <dl className="mt-3 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Stage ID
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {activeStage.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Owner
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {activeStage.actor}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Status
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {activeStage.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">
                      Notification
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {activeStageNotification ? "Enabled" : "Not configured"}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Transitions
                </h3>
                {activeStage.transitions.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {activeStage.transitions.map((transition, transitionIndex) => (
                      <li
                        key={`${activeStage.id}-${transition.to}-${transitionIndex}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-semibold text-slate-800">
                            To · {transition.to.toUpperCase()}
                          </div>
                          {transition.label ? (
                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {transition.label}
                            </span>
                          ) : null}
                        </div>
                        {transition.conditions?.length ? (
                          <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                            {transition.conditions.map((condition) => (
                              <li key={condition}>{condition}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            No additional conditions.
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    This stage has no outgoing transitions and completes the flow.
                  </p>
                )}
              </section>
              <section className="px-6 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Notification preview
                </h3>
                {activeStageNotification ? (
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Actor:
                      </span>{" "}
                      {activeStageNotification.actor?.name ?? "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">
                        Supervisor:
                      </span>{" "}
                      {activeStageNotification.supervisor?.name ?? "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">
                        To:
                      </span>{" "}
                      {activeStageNotification.to.join(", ")}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">
                        CC:
                      </span>{" "}
                      {activeStageNotification.cc.length
                        ? activeStageNotification.cc.join(", ")
                        : "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">
                        Subject:
                      </span>{" "}
                      {activeStageNotification.subject}
                    </div>
                    <pre className="mt-3 max-h-[260px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-950/95 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap">
{activeStageNotification.body}
                    </pre>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                    No email notification configured for this stage.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Path configuration
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Choose a start and end status, then list any intermediate
                statuses to validate the route. Final states default to Approved
                or Reject.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start status
                  </label>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    value={startStatus}
                    onChange={(event) =>
                      setStartStatus(event.target.value as ApprovalStatus)
                    }
                  >
                    {allStatuses.map((status) => (
                      <option key={`start-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    End status
                  </label>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    value={endStatus}
                    onChange={(event) =>
                      setEndStatus(event.target.value as ApprovalStatus)
                    }
                  >
                    {FINAL_STATUSES.map((status) => (
                      <option key={`end-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Intermediate statuses
                </label>
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={transitionsJson}
                  onChange={(event) => setTransitionsJson(event.target.value)}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Final statuses:&nbsp;
                {FINAL_STATUSES.map((status) => (
                  <span
                    key={`final-${status}`}
                    className="mr-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      {isJsonModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={() => setIsJsonModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          >
            <header className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Flow JSON definition
                </h2>
                <p className="text-xs text-slate-500">
                  Review or edit the stages array backing this approval flow.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetToDefinition}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Reset to definition
                </button>
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </header>
            <div className="p-6">
              <textarea
                className="min-h-[420px] w-full rounded-lg border border-slate-200 bg-slate-950/95 px-3 py-2 font-mono text-xs text-slate-100 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={definitionJson}
                onChange={(event) => setDefinitionJson(event.target.value)}
              />
              <p className="mt-3 text-xs text-slate-500">
                Changes apply immediately. Close the modal to continue working
                with the stage map and path tools.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={evaluate}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Validate Path
          </button>
          {evaluation ? (
            <span
              className={[
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                evaluation.isValid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {evaluation.isValid ? "Path is valid" : "Path has issues"}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {error ? (
            <p className="text-sm text-rose-600">⚠️ {error}</p>
          ) : null}
          {evaluation && evaluation.issues.length > 0 ? (
            <ul className="list-disc pl-5 text-xs text-rose-600">
              {evaluation.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
