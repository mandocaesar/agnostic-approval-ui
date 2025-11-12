"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ApprovalFlow, ApprovalStatus, Domain, User } from "@/types";

const STATUS_OPTIONS: {
  value: ApprovalStatus;
  label: string;
  forceFinal?: boolean;
}[] = [
  { value: "in_process", label: "In process" },
  { value: "approved", label: "Approved", forceFinal: true },
  { value: "reject", label: "Reject" },
  { value: "end", label: "End", forceFinal: true },
];

const STATUS_LABELS = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ApprovalStatus, string>;

const FINAL_STATUSES: ApprovalStatus[] = STATUS_OPTIONS.filter(
  (option) => option.forceFinal,
).map((option) => option.value);

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 560;
const CARD_WIDTH = 220;
const CARD_HEIGHT = 150;
const CANVAS_PADDING = 48;
const WORKSPACE_BUFFER = 400;

interface StageDraft {
  id: string;
  name: string;
  status: ApprovalStatus;
  description: string;
  actorUserId: string;
  notifySupervisor: boolean;
  ccActor: boolean;
  isFinal?: boolean;
  transitions: StageTransitionDraft[];
  position: {
    x: number;
    y: number;
  };
}

interface StageTransitionDraft {
  id: string;
  targetStageId: string | null;
  targetStageName?: string;
  targetStageStatus?: ApprovalStatus;
  label: string;
  conditions: string;
}

interface StageTransitionSeed {
  id: string;
  targetStatus?: ApprovalStatus | null;
  targetStageId?: string | null;
  targetStageName?: string;
  targetStageStatus?: ApprovalStatus | null;
  label: string;
  conditions: string;
}

interface BuilderPreset {
  flowName: string;
  flowVersion: string;
  stages: StageDraft[];
  domainId?: string;
  subdomainId?: string;
}

interface RuleBuilderProps {
  users: User[];
  domains: Domain[];
  initialFlowContext?: {
    flow: ApprovalFlow;
    domain: Domain;
    subdomain: Domain["subdomains"][number];
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createStageId() {
  return `stage-${Math.random().toString(36).slice(2, 8)}`;
}

function createTransitionDraft(
  overrides: Partial<StageTransitionDraft> = {},
): StageTransitionDraft {
  return {
    id: createStageId(),
    targetStageId: null,
    targetStageName: undefined,
    targetStageStatus: undefined,
    label: "",
    conditions: "",
    ...overrides,
  };
}

function isLockedFinalStatus(status: ApprovalStatus) {
  return FINAL_STATUSES.includes(status);
}

function isStageFinal(stage: StageDraft) {
  return isLockedFinalStatus(stage.status) || Boolean(stage.isFinal);
}

function stagePosition(index: number): { x: number; y: number } {
  const spacingX = 260;
  const rows = 2;
  const rowHeight = 200;
  const row = index % rows;
  const col = Math.floor(index / rows);
  return {
    x: CANVAS_PADDING + col * spacingX,
    y: CANVAS_PADDING + row * rowHeight,
  };
}

function findUserId(users: User[], matcher: RegExp) {
  return users.find((user) => matcher.test(user.role))?.id ?? users[0]?.id ?? "";
}

function createInitialPreset(users: User[]): BuilderPreset {
  const draftOwner = findUserId(users, /product owner/i);
  const opsLead = findUserId(users, /operations|procurement/i);
  const finalApprover = findUserId(users, /admin|compliance/i);
  const stageIds = {
    draft: createStageId(),
    ops: createStageId(),
    final: createStageId(),
  };

  const baseStages: (Omit<StageDraft, "position" | "transitions"> & {
    transitions: StageTransitionSeed[];
  })[] = [
    {
      id: stageIds.draft,
      name: "Draft business case",
      status: "in_process",
      description:
        "Capture scope, KPIs, and supporting documents for the requested change.",
      actorUserId: draftOwner,
      notifySupervisor: true,
      ccActor: true,
      isFinal: false,
      transitions: [
        {
          id: createStageId(),
          targetStageId: stageIds.ops,
          targetStageName: "Operations validation",
          label: "Submit for triage",
          conditions: "Business case attached\nBudget validated",
        },
      ],
    },
    {
      id: stageIds.ops,
      name: "Operations validation",
      status: "in_process",
      description:
        "Operations lead verifies vendor readiness, SLAs, and settlement coverage.",
      actorUserId: opsLead,
      notifySupervisor: true,
      ccActor: false,
      isFinal: false,
      transitions: [
        {
          id: createStageId(),
          targetStageId: stageIds.final,
          targetStageName: "Final approval",
          label: "Approve hand-off",
          conditions: "Vendor SLA confirmed\nSettlement runbook updated",
        },
        {
          id: createStageId(),
          targetStatus: "reject",
          targetStageName: "Rejected",
          targetStageStatus: "reject",
          label: "Reject for rework",
          conditions: "Critical documentation missing",
        },
      ],
    },
    {
      id: stageIds.final,
      name: "Final approval",
      status: "approved",
      description:
        "Executive approver signs off on launch timings and controls.",
      actorUserId: finalApprover,
      notifySupervisor: false,
      ccActor: false,
      isFinal: true,
      transitions: [],
    },
  ];

  const statusToStageId = new Map<ApprovalStatus, string>();
  const stageMetaById = new Map(
    baseStages.map((stage) => [stage.id, { name: stage.name, status: stage.status }]),
  );
  baseStages.forEach((stage) => statusToStageId.set(stage.status, stage.id));

  const stages: StageDraft[] = baseStages.map((stage, index) => ({
    ...stage,
    transitions: stage.transitions.map((transition) => {
      const explicitTargetId =
        transition.targetStageId ??
        (transition.targetStatus
          ? statusToStageId.get(transition.targetStatus)
          : null);
      const targetMeta = explicitTargetId
        ? stageMetaById.get(explicitTargetId)
        : null;
      return createTransitionDraft({
        id: transition.id,
        targetStageId: explicitTargetId ?? null,
        targetStageName: transition.targetStageName ?? targetMeta?.name,
        targetStageStatus:
          transition.targetStageStatus ?? targetMeta?.status ?? undefined,
        label: transition.label,
        conditions: transition.conditions,
      });
    }),
    position: stagePosition(index),
  }));

  return {
    flowName: "New Approval Flow",
    flowVersion: "1.0.0",
    stages,
  };
}

function buildPresetFromFlow(
  context: {
    flow: ApprovalFlow;
    domain: Domain;
    subdomain: Domain["subdomains"][number];
  },
  users: User[],
): BuilderPreset {
  const fallbackActorId = users[0]?.id ?? "";
  const statusToStageId = new Map<ApprovalStatus, string>();
  const stageMetaMap = new Map(
    context.flow.definition.stages.map((stage) => [stage.id, stage]),
  );
  context.flow.definition.stages.forEach((stage) => {
    statusToStageId.set(stage.status, stage.id);
  });
  const stageDrafts: StageDraft[] = context.flow.definition.stages.map(
    (stage, index) => {
      return {
        id: stage.id || createStageId(),
        name: stage.name,
        status: stage.status,
        description: stage.description,
        actorUserId: stage.actorUserId ?? fallbackActorId,
        notifySupervisor: stage.notification?.sendToActorSupervisor ?? false,
        ccActor: stage.notification?.ccActor ?? false,
        isFinal: isLockedFinalStatus(stage.status),
        transitions: (stage.transitions ?? []).map((transition) => {
          const resolvedTargetId =
            transition.targetStageId ??
            statusToStageId.get(transition.to) ??
            null;
          const targetStage = resolvedTargetId
            ? stageMetaMap.get(resolvedTargetId)
            : null;
          return {
            id: `${stage.id}-${resolvedTargetId ?? transition.to}-${transition.label ?? "branch"}`,
            targetStageId: resolvedTargetId,
            targetStageName:
              transition.targetStageName ?? targetStage?.name ?? undefined,
            targetStageStatus: targetStage?.status ?? transition.to,
            label: transition.label ?? "",
            conditions: (transition.conditions ?? []).join("\n"),
          };
        }),
        position: stagePosition(index),
      };
    },
  );

  return {
    flowName: context.flow.name,
    flowVersion: context.flow.version,
    stages: stageDrafts,
    domainId: context.domain.id,
    subdomainId: context.subdomain.id,
  };
}

function conditionsToArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sortStagesForFlow(stages: StageDraft[]) {
  return stages
    .slice()
    .sort(
      (a, b) =>
        a.position.x - b.position.x ||
        a.position.y - b.position.y ||
        a.name.localeCompare(b.name),
    );
}

export function RuleBuilder({
  users,
  domains,
  initialFlowContext,
}: RuleBuilderProps) {
  const defaultPreset = useMemo(() => createInitialPreset(users), [users]);
  const editPreset = useMemo(
    () =>
      initialFlowContext
        ? buildPresetFromFlow(initialFlowContext, users)
        : null,
    [initialFlowContext, users],
  );
  const currentPreset = editPreset ?? defaultPreset;
  const isEditing = Boolean(initialFlowContext);

  const [flowName, setFlowName] = useState(currentPreset.flowName);
  const [flowVersion, setFlowVersion] = useState(currentPreset.flowVersion);
  const [stages, setStages] = useState<StageDraft[]>(currentPreset.stages);
  const [selectedStageId, setSelectedStageId] = useState(
    currentPreset.stages[0]?.id ?? "",
  );
  const [selectedDomainId, setSelectedDomainId] = useState(
    currentPreset.domainId ?? domains[0]?.id ?? "",
  );
  const [selectedSubdomainId, setSelectedSubdomainId] = useState(
    currentPreset.subdomainId ??
      domains.find((domain) => domain.id === currentPreset.domainId)?.subdomains[0]
        ?.id ??
      domains[0]?.subdomains[0]?.id ??
      "",
  );
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [linkSourceStageId, setLinkSourceStageId] = useState<string | null>(
    null,
  );
  const [jsonRecentlyUpdated, setJsonRecentlyUpdated] = useState(false);
  const [linkPreview, setLinkPreview] = useState<{
    sourceStageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const panOriginRef = useRef({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const userMap = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user])),
    [users],
  );
  const selectedDomain = useMemo(
    () => domains.find((domain) => domain.id === selectedDomainId) ?? domains[0],
    [domains, selectedDomainId],
  );
  const selectedSubdomain = useMemo(
    () =>
      selectedDomain?.subdomains.find(
        (subdomain) => subdomain.id === selectedSubdomainId,
      ) ?? selectedDomain?.subdomains[0],
    [selectedDomain, selectedSubdomainId],
  );
  const subdomainOptions = selectedDomain?.subdomains ?? [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        setIsSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const applyPreset = useCallback(
    (presetToApply: BuilderPreset) => {
      setFlowName(presetToApply.flowName);
      setFlowVersion(presetToApply.flowVersion);
      setStages(presetToApply.stages);
      setSelectedStageId(presetToApply.stages[0]?.id ?? "");
      const fallbackDomainId = presetToApply.domainId ?? domains[0]?.id ?? "";
      setSelectedDomainId(fallbackDomainId);
      const fallbackSubdomainId =
        presetToApply.subdomainId ??
        domains.find((domain) => domain.id === fallbackDomainId)?.subdomains[0]
          ?.id ??
        domains[0]?.subdomains[0]?.id ??
        "";
      setSelectedSubdomainId(fallbackSubdomainId);
      setZoom(1);
    },
    [domains],
  );

  const handleDomainChange = (domainId: string) => {
    setSelectedDomainId(domainId);
    const domain = domains.find((item) => item.id === domainId);
    setSelectedSubdomainId(domain?.subdomains[0]?.id ?? "");
  };

  const handleSubdomainChange = (subdomainId: string) => {
    setSelectedSubdomainId(subdomainId);
  };

  const addTransitionBranch = (stageId: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              transitions:
                stage.transitions.length >= 2
                  ? stage.transitions
                  : [
                      ...stage.transitions,
                      createTransitionDraft(),
                    ],
            }
          : stage,
      ),
    );
  };

  const updateTransitionBranch = (
    stageId: string,
    branchId: string,
    updates: Partial<StageTransitionDraft>,
  ) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              transitions: stage.transitions.map((branch) =>
                branch.id === branchId ? { ...branch, ...updates } : branch,
              ),
            }
          : stage,
      ),
    );
  };

  const setTransitionTargetStage = (
    stageId: string,
    branchId: string,
    targetStageId: string | null,
  ) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }
        const targetStage = targetStageId
          ? prev.find((candidate) => candidate.id === targetStageId)
          : null;
        return {
          ...stage,
          transitions: stage.transitions.map((branch) =>
            branch.id === branchId
              ? {
                  ...branch,
                  targetStageId,
                  targetStageName: targetStage?.name,
                  targetStageStatus: targetStage?.status,
                }
              : branch,
          ),
        };
      }),
    );
    setJsonRecentlyUpdated(true);
  };

  const disconnectTransition = (stageId: string, transitionId: string) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }
        return {
          ...stage,
          transitions: stage.transitions.map((transition) =>
            transition.id === transitionId
              ? {
                  ...transition,
                  targetStageId: null,
                  targetStageName: undefined,
                  targetStageStatus: undefined,
                }
              : transition,
          ),
        };
      }),
    );
    setJsonRecentlyUpdated(true);
  };

  const removeTransitionBranch = (stageId: string, branchId: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              transitions: stage.transitions.filter(
                (branch) => branch.id !== branchId,
              ),
            }
          : stage,
      ),
    );
  };

  const toggleFinalState = (stage: StageDraft, nextIsFinal: boolean) => {
    if (isLockedFinalStatus(stage.status)) {
      return;
    }
    if (nextIsFinal) {
      handleStageChange(stage.id, {
        isFinal: true,
        transitions: [],
      });
    } else {
      handleStageChange(stage.id, {
        isFinal: false,
        transitions:
          stage.transitions.length > 0
            ? stage.transitions
            : [createTransitionDraft()],
      });
    }
  };

  const orderedStages = useMemo(() => sortStagesForFlow(stages), [stages]);
  const stageById = useMemo(() => {
    return new Map(stages.map((stage): [string, StageDraft] => [stage.id, stage]));
  }, [stages]);
  const selectedStage =
    stages.find((stage) => stage.id === selectedStageId) ?? stages[0] ?? null;

  const stageBounds = useMemo(() => {
    return stages.reduce(
      (acc, stage) => ({
        maxX: Math.max(acc.maxX, stage.position.x),
        maxY: Math.max(acc.maxY, stage.position.y),
      }),
      { maxX: 0, maxY: 0 },
    );
  }, [stages]);

  const stagePayload = orderedStages.map((stage) => {
    const actor = userMap[stage.actorUserId];
    const stageIsFinal = isStageFinal(stage);
    const transitions =
      stageIsFinal || stage.transitions.length === 0
        ? []
        : stage.transitions
            .map((transition) => {
              if (!transition.targetStageId) {
                return null;
              }
              const targetStage = stageById.get(transition.targetStageId);
              if (!targetStage) {
                return null;
              }
              return {
                to: transition.targetStageStatus ?? targetStage.status,
                targetStageId: targetStage.id,
                targetStageName:
                  transition.targetStageName ?? targetStage.name,
                label: transition.label || undefined,
                conditions: conditionsToArray(transition.conditions),
              };
            })
            .filter(
              (
                transition,
              ): transition is {
                to: ApprovalStatus;
                targetStageId: string;
                targetStageName: string;
                label?: string;
                conditions: string[];
              } => Boolean(transition),
            );

    const notification =
      stage.notifySupervisor || stage.ccActor
        ? {
            subject: `${flowName} · ${stage.name}`,
            body: `{{actorName}} progressed ${flowName} into the ${stage.name} stage for {{domainName}} · {{subdomainName}}.`,
            sendToActorSupervisor: stage.notifySupervisor,
            ccActor: stage.ccActor,
          }
        : undefined;

    return {
      id: stage.id,
      status: stage.status,
      name: stage.name,
      description: stage.description,
      actor: actor?.role ?? "Process Owner",
      actorUserId: stage.actorUserId,
      isFinal: stageIsFinal,
      transitions,
      notification,
    };
  });

  const previewJson = useMemo(
    () =>
      JSON.stringify(
        {
          id: "builder-flow",
          name: flowName,
          version: flowVersion,
          description: "Drafted via interactive canvas",
          domain: selectedDomainId,
          subdomain: selectedSubdomainId,
          domainName: selectedDomain?.name ?? "",
          subdomainName: selectedSubdomain?.name ?? "",
          definition: { stages: stagePayload },
        },
        null,
        2,
      ),
    [
      flowName,
      flowVersion,
      selectedDomainId,
      selectedSubdomainId,
      selectedDomain?.name,
      selectedSubdomain?.name,
      stagePayload,
    ],
  );

  const workspaceWidth = Math.max(
    CANVAS_WIDTH + WORKSPACE_BUFFER,
    stageBounds.maxX + CARD_WIDTH + CANVAS_PADDING + WORKSPACE_BUFFER,
  );
  const workspaceHeight = Math.max(
    CANVAS_HEIGHT + WORKSPACE_BUFFER,
    stageBounds.maxY + CARD_HEIGHT + CANVAS_PADDING + WORKSPACE_BUFFER,
  );

  const handlePanStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) {
      return;
    }
    const isMiddleClick = event.button === 1;
    if (!isSpacePressed && !isMiddleClick) {
      return;
    }
    event.preventDefault();
    const pointerId = event.pointerId;
    const originX = event.clientX - canvasPan.x;
    const originY = event.clientY - canvasPan.y;
    panOriginRef.current = { x: originX, y: originY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }
      setCanvasPan({
        x: moveEvent.clientX - panOriginRef.current.x,
        y: moveEvent.clientY - panOriginRef.current.y,
      });
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startDragging = (stageId: string, event: ReactPointerEvent) => {
    if (isSpacePressed) {
      return;
    }
    const stage = stages.find((node) => node.id === stageId);
    if (!stage || !canvasRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX =
      (event.clientX - rect.left - canvasPan.x) / zoom - stage.position.x;
    const offsetY =
      (event.clientY - rect.top - canvasPan.y) / zoom - stage.position.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!canvasRef.current) {
        return;
      }
      const bounds = canvasRef.current.getBoundingClientRect();
      const canvasX =
        (moveEvent.clientX - bounds.left - canvasPan.x) / zoom - offsetX;
      const canvasY =
        (moveEvent.clientY - bounds.top - canvasPan.y) / zoom - offsetY;

      const maxX =
        workspaceWidth - CARD_WIDTH - CANVAS_PADDING + WORKSPACE_BUFFER;
      const maxY =
        workspaceHeight - CARD_HEIGHT - CANVAS_PADDING + WORKSPACE_BUFFER;
      const minX = CANVAS_PADDING;
      const minY = CANVAS_PADDING;

      setStages((prev) =>
        prev.map((node) =>
          node.id === stageId
            ? {
                ...node,
                position: {
                  x: clamp(canvasX, minX, maxX),
                  y: clamp(canvasY, minY, maxY),
                },
              }
            : node,
        ),
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleStageChange = (stageId: string, updates: Partial<StageDraft>) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }
        const nextStage: StageDraft = { ...stage, ...updates };
        if (updates.status) {
          if (isLockedFinalStatus(updates.status)) {
            nextStage.isFinal = true;
            nextStage.transitions = [];
          } else if (
            isLockedFinalStatus(stage.status) &&
            !isLockedFinalStatus(updates.status) &&
            nextStage.transitions.length === 0
          ) {
            nextStage.transitions = [createTransitionDraft()];
          }
        }
        return nextStage;
      }),
    );
  };

  const addStage = () => {
    const nextIndex = stages.length;
    const lastStage = orderedStages[orderedStages.length - 1];
    const lastStageIsFinal = lastStage ? isStageFinal(lastStage) : false;
    const status: ApprovalStatus = lastStageIsFinal ? "in_process" : "approved";
    const statusIsLocked = isLockedFinalStatus(status);
    const newStage: StageDraft = {
      id: createStageId(),
      name: "New stage",
      status,
      description: "Describe the work performed in this step.",
      actorUserId: lastStage?.actorUserId ?? users[0]?.id ?? "",
      notifySupervisor: true,
      ccActor: false,
      isFinal: statusIsLocked,
      transitions: statusIsLocked ? [] : [createTransitionDraft()],
      position: stagePosition(nextIndex),
    };

    setStages((prev) => [...prev, newStage]);
    setSelectedStageId(newStage.id);
  };

  const removeStage = (stageId: string) => {
    if (stages.length <= 1) {
      return;
    }
    setStages((prev) => {
      const filtered = prev.filter((stage) => stage.id !== stageId);
      const cleaned = filtered.map((stage) => ({
        ...stage,
        transitions: stage.transitions.filter(
          (transition) => transition.targetStageId !== stageId,
        ),
      }));
      if (!cleaned.some((stage) => stage.id === selectedStageId)) {
        setSelectedStageId(cleaned[cleaned.length - 1]?.id ?? "");
      }
      return cleaned;
    });
  };

  useEffect(() => {
    if (!linkSourceStageId) {
      return;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLinkSourceStageId(null);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [linkSourceStageId]);

  useEffect(() => {
    if (!jsonRecentlyUpdated) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setJsonRecentlyUpdated(false);
    }, 1500);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [jsonRecentlyUpdated]);

  const resetBuilder = () => {
    applyPreset(currentPreset);
    setCopied(false);
    setIsStageModalOpen(false);
    setIsJsonModalOpen(false);
    setJsonRecentlyUpdated(false);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(previewJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const startLinkingFromStage = (stageId: string) => {
    if (isSpacePressed) {
      return;
    }
    const stage = stages.find((node) => node.id === stageId);
    if (!stage || isStageFinal(stage)) {
      return;
    }
    setLinkSourceStageId(stageId);
  };

  const startLinkDrag = (stageId: string, event: ReactPointerEvent) => {
    if (isSpacePressed) {
      return;
    }
    const stage = stages.find((node) => node.id === stageId);
    if (!stage || isStageFinal(stage) || !canvasRef.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setLinkSourceStageId(stageId);

    const updatePreview = (clientX: number, clientY: number) => {
      if (!canvasRef.current) {
        return;
      }
      const rect = canvasRef.current.getBoundingClientRect();
      setLinkPreview({
        sourceStageId: stageId,
        x: (clientX - rect.left - canvasPan.x) / zoom,
        y: (clientY - rect.top - canvasPan.y) / zoom,
      });
    };

    updatePreview(event.clientX, event.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updatePreview(moveEvent.clientX, moveEvent.clientY);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      setLinkPreview(null);
      const targetStageElement = (upEvent.target as HTMLElement | null)?.closest(
        "[data-stage-id]",
      ) as HTMLElement | null;
      const targetStageId = targetStageElement?.dataset.stageId;
      if (targetStageId) {
        connectStages(stageId, targetStageId);
      } else {
        setLinkSourceStageId(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const connectStages = (sourceStageId: string, targetStageId: string) => {
    let didConnect = false;
    setStages((prev) => {
      const sourceStage = prev.find((stage) => stage.id === sourceStageId);
      const targetStage = prev.find((stage) => stage.id === targetStageId);
      if (
        !sourceStage ||
        !targetStage ||
        sourceStage.id === targetStage.id ||
        isStageFinal(sourceStage)
      ) {
        return prev;
      }

      const updatedStages = prev.map((stage) => {
        if (stage.id !== sourceStageId) {
          return stage;
        }
        let transitions = stage.transitions.map((transition) => ({
          ...transition,
        }));
        if (
          transitions.some(
            (transition) => transition.targetStageId === targetStageId,
          )
        ) {
          didConnect = true;
          return {
            ...stage,
            transitions,
          };
        }

        const emptyTransition = transitions.find(
          (transition) => !transition.targetStageId,
        );
        if (emptyTransition) {
          emptyTransition.targetStageId = targetStageId;
          emptyTransition.targetStageName = targetStage?.name;
          emptyTransition.targetStageStatus = targetStage?.status;
          emptyTransition.label =
            emptyTransition.label || `Route to ${targetStage.name}`;
          didConnect = true;
          return {
            ...stage,
            transitions,
          };
        }

        if (transitions.length >= 2) {
          return stage;
        }

        transitions = [
          ...transitions,
          createTransitionDraft({
            targetStageId: targetStageId,
            targetStageName: targetStage?.name,
            targetStageStatus: targetStage?.status,
            label: `Route to ${targetStage.name}`,
          }),
        ];
        didConnect = true;
        return {
          ...stage,
          transitions,
        };
      });

      return updatedStages;
    });

    if (didConnect) {
      setSelectedStageId(sourceStageId);
      setJsonRecentlyUpdated(true);
      setLinkSourceStageId(null);
    }
  };

  const connectors = useMemo(() => {
    const lines: {
      id: string;
      transitionId: string;
      sourceStageId: string;
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[] = [];
    stages.forEach((stage) => {
      const stageIsFinal = isStageFinal(stage);
      if (stageIsFinal) {
        return;
      }
      stage.transitions.forEach((transition) => {
        if (!transition.targetStageId) {
          return;
        }
        const target = stageById.get(transition.targetStageId);
        if (!target) {
          return;
        }
        lines.push({
          id: `${stage.id}-${transition.id}`,
          transitionId: transition.id,
          sourceStageId: stage.id,
          start: {
            x: stage.position.x + CARD_WIDTH,
            y: stage.position.y + CARD_HEIGHT / 2,
          },
          end: {
            x: target.position.x,
            y: target.position.y + CARD_HEIGHT / 2,
          },
        });
      });
    });
    return lines;
  }, [stageById, stages]);

  const handleStageCardClick = (stageId: string) => {
    if (linkSourceStageId) {
      connectStages(linkSourceStageId, stageId);
      return;
    }
    setSelectedStageId(stageId);
  };

  const handleStageCardDoubleClick = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsStageModalOpen(true);
  };

  return (
    <section className="flex flex-col gap-6 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Edit flow blueprint" : "Builder canvas"}
          </h2>
          <p className="text-sm text-slate-500">
            Arrange stages like n8n nodes—drag to reorder, zoom the canvas, and
            configure metadata per node.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetBuilder}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsJsonModalOpen(true)}
            className="inline-flex items-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
          >
            View JSON
          </button>
          {jsonRecentlyUpdated ? (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              JSON updated
            </span>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Flow name
                <input
                  type="text"
                  value={flowName}
                  onChange={(event) => setFlowName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Version
                <input
                  type="text"
                  value={flowVersion}
                  onChange={(event) => setFlowVersion(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Domain
                <select
                  value={selectedDomainId}
                  onChange={(event) => handleDomainChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Subdomain
                <select
                  value={selectedSubdomain?.id ?? ""}
                  onChange={(event) => handleSubdomainChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  disabled={!subdomainOptions.length}
                >
                  {subdomainOptions.map((subdomain) => (
                    <option key={subdomain.id} value={subdomain.id}>
                      {subdomain.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Zoom
                <button
                  type="button"
                  onClick={() => setZoom((value) => clamp(value - 0.1, 0.6, 1.4))}
                  className="h-6 w-6 rounded-full border border-slate-200 text-base text-slate-700"
                >
                  −
                </button>
                <input
                  type="range"
                  min={0.6}
                  max={1.4}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="h-1 w-40 accent-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setZoom((value) => clamp(value + 0.1, 0.6, 1.4))}
                  className="h-6 w-6 rounded-full border border-slate-200 text-base text-slate-700"
                >
                  +
                </button>
                <span className="text-slate-700">{(zoom * 100).toFixed(0)}%</span>
              </div>
              <button
                type="button"
                onClick={addStage}
                className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                + Add stage
              </button>
              <button
                type="button"
                onClick={() => setIsStageModalOpen(true)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Stage editor
              </button>
              {linkSourceStageId ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-sm">
                  <span>
                    Linking from{" "}
                    {
                      stages.find((stage) => stage.id === linkSourceStageId)
                        ?.name
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setLinkSourceStageId(null)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tip: drag the ● handle on a node to connect it to another node,
              double-click a dashed connector to unlink, and hold Space + drag
              anywhere on the canvas to pan when you need extra room.
            </p>
          </div>

          <div
            ref={canvasRef}
            onPointerDown={handlePanStart}
            className="relative h-[560px] w-full overflow-hidden border border-slate-900/40 bg-slate-950 text-white shadow-inner"
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: workspaceWidth,
                height: workspaceHeight,
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                  pointerEvents: "none",
                }}
              />
              <div className="absolute inset-0">
                <svg
                  width={workspaceWidth}
                  height={workspaceHeight}
                  className="absolute inset-0"
                >
                  {connectors.map((connector) => (
                    <line
                      key={connector.id}
                      x1={connector.start.x}
                      y1={connector.start.y}
                      x2={connector.end.x}
                      y2={connector.end.y}
                      stroke="rgba(16, 185, 129, 0.6)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray="6 6"
                      pointerEvents="stroke"
                      className="cursor-pointer transition hover:stroke-emerald-300"
                      onDoubleClick={() =>
                        disconnectTransition(
                          connector.sourceStageId,
                          connector.transitionId,
                        )
                      }
                    />
                  ))}
                  {linkPreview && stageById.has(linkPreview.sourceStageId) ? (
                    <line
                      x1={
                        (stageById.get(linkPreview.sourceStageId)?.position.x ?? 0) +
                        CARD_WIDTH
                      }
                      y1={
                        (stageById.get(linkPreview.sourceStageId)?.position.y ?? 0) +
                        CARD_HEIGHT / 2
                      }
                      x2={linkPreview.x}
                      y2={linkPreview.y}
                      stroke="rgba(248, 250, 252, 0.7)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                      pointerEvents="none"
                    />
                  ) : null}
                </svg>
                {stages.map((stage) => {
                  const isSelected = selectedStageId === stage.id;
                  const actor = userMap[stage.actorUserId];
                  const isFinal = isStageFinal(stage);
                  const statusLabel = STATUS_LABELS[stage.status] ?? stage.status;
                  const isLinkSource = linkSourceStageId === stage.id;
                const isLinkTargetCandidate =
                  Boolean(linkSourceStageId) &&
                  linkSourceStageId !== stage.id &&
                  !isLinkSource;
                return (
                  <div
                    key={stage.id}
                    data-stage-id={stage.id}
                    style={{
                      position: "absolute",
                      left: stage.position.x,
                      top: stage.position.y,
                      width: CARD_WIDTH,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleStageCardClick(stage.id)}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        handleStageCardDoubleClick(stage.id);
                      }}
                      className={[
                        "group flex h-[150px] flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
                        isSelected
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-white/20 bg-white/5 hover:border-emerald-200/70",
                        isLinkSource
                          ? "ring-2 ring-amber-300 border-amber-200/80"
                          : "",
                        isLinkTargetCandidate
                          ? "border-emerald-300/70"
                          : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                        <span>
                          {statusLabel}
                          {isFinal ? " · Final" : ""}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            role="button"
                            tabIndex={isFinal ? -1 : 0}
                            aria-disabled={isFinal}
                            title="Drag to connect"
                            onPointerDown={(event) => {
                              if (isFinal) {
                                return;
                              }
                              startLinkDrag(stage.id, event);
                            }}
                            onClick={(event) => {
                              if (isFinal) {
                                return;
                              }
                              event.stopPropagation();
                              startLinkingFromStage(stage.id);
                            }}
                            onKeyDown={(event) => {
                              if (
                                isFinal ||
                                (event.key !== "Enter" && event.key !== " ")
                              ) {
                                return;
                              }
                              event.preventDefault();
                              startLinkingFromStage(stage.id);
                            }}
                            className={[
                              "flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-300",
                              isLinkSource
                                ? "border-emerald-300 bg-emerald-400"
                                : "border-white/30 bg-white/15 hover:bg-white/30",
                              isFinal ? "pointer-events-none opacity-50" : "",
                            ].join(" ")}
                          >
                            <span className="text-[9px] font-black leading-none">
                              ●
                            </span>
                          </span>
                          <span
                            className="cursor-grab rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] text-slate-200 active:cursor-grabbing"
                            onPointerDown={(event) => startDragging(stage.id, event)}
                          >
                            Drag
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">
                          {stage.name}
                        </p>
                        <p className="text-xs text-slate-300">
                          {stage.description}
                        </p>
                      </div>
                      <div className="text-xs text-slate-300">
                        Actor:{" "}
                        <span className="text-slate-100">
                          {actor?.name ?? "Unassigned"}
                        </span>
                      </div>
                      <div className="mt-auto text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                        {stage.notifySupervisor ? "Notifies supervisor" : "Silent"}
                      </div>
                    </button>
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {isStageModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setIsStageModalOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Stage editor & summary
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Configure node metadata
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Close
              </button>
            </header>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {selectedStage ? (() => {
                  const stageIsFinal = isStageFinal(selectedStage);
                  const statusLockedFinal = isLockedFinalStatus(
                    selectedStage.status,
                  );
                  return (
                    <div className="space-y-4 text-sm text-slate-700">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Stage name
                        <input
                          type="text"
                          value={selectedStage.name}
                          onChange={(event) =>
                            handleStageChange(selectedStage.id, {
                              name: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                        <select
                          value={selectedStage.status}
                          onChange={(event) =>
                            handleStageChange(selectedStage.id, {
                              status: event.target.value as ApprovalStatus,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Description
                      <textarea
                        value={selectedStage.description}
                        onChange={(event) =>
                          handleStageChange(selectedStage.id, {
                            description: event.target.value,
                          })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actor
                      <select
                        value={selectedStage.actorUserId}
                        onChange={(event) =>
                          handleStageChange(selectedStage.id, {
                            actorUserId: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} · {user.role}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <label className="flex items-center justify-between gap-3">
                        <span>Final state</span>
                        <input
                          type="checkbox"
                          checked={stageIsFinal}
                          disabled={statusLockedFinal}
                          onChange={(event) =>
                            toggleFinalState(selectedStage, event.target.checked)
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                      {statusLockedFinal ? (
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Approved and End nodes always complete the flow and cannot
                          branch forward.
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Final states complete the flow and cannot branch to other
                          statuses.
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Transition branches
                        </h4>
                        <button
                          type="button"
                          onClick={() => addTransitionBranch(selectedStage.id)}
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            stageIsFinal ||
                            selectedStage.transitions.length >= 2
                          }
                        >
                          + Add branch
                        </button>
                      </div>
                      {stageIsFinal ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Final stages do not support outgoing transitions.
                        </p>
                      ) : selectedStage.transitions.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">
                          No branches configured. Add a branch to route this stage
                          forward.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {selectedStage.transitions.map((branch, branchIndex) => (
                            <div
                              key={branch.id}
                              className="space-y-3 rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <span>Branch {branchIndex + 1}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTransitionBranch(selectedStage.id, branch.id)
                                  }
                                  className="text-rose-500 hover:text-rose-600 disabled:opacity-50"
                                  disabled={selectedStage.transitions.length <= 1}
                                >
                                  Remove
                                </button>
                              </div>
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Destination stage
                                <select
                                  value={branch.targetStageId ?? ""}
                                  onChange={(event) =>
                                    setTransitionTargetStage(
                                      selectedStage.id,
                                      branch.id,
                                      event.target.value || null,
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                  <option value="">Select destination</option>
                                  {stages
                                    .filter((candidate) => candidate.id !== selectedStage.id)
                                    .map((candidate) => {
                                      const candidateIsFinal = isStageFinal(candidate);
                                      const candidateStatusLabel =
                                        STATUS_LABELS[candidate.status] ?? candidate.status;
                                      return (
                                        <option key={`${branch.id}-${candidate.id}`} value={candidate.id}>
                                          {candidate.name} · {candidateStatusLabel}
                                          {candidateIsFinal ? " (final)" : ""} · {candidate.id}
                                        </option>
                                      );
                                    })}
                                </select>
                              </label>
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Branch label
                                <input
                                  type="text"
                                  value={branch.label}
                                  onChange={(event) =>
                                    updateTransitionBranch(selectedStage.id, branch.id, {
                                      label: event.target.value,
                                    })
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                              </label>
                              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Conditions (one per line)
                                <textarea
                                  value={branch.conditions}
                                  onChange={(event) =>
                                    updateTransitionBranch(selectedStage.id, branch.id, {
                                      conditions: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notifications
                      <label className="flex items-center gap-2 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedStage.notifySupervisor}
                          onChange={(event) =>
                            handleStageChange(selectedStage.id, {
                              notifySupervisor: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Notify supervisor
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedStage.ccActor}
                          onChange={(event) =>
                            handleStageChange(selectedStage.id, {
                              ccActor: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        CC actor
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeStage(selectedStage.id)}
                        disabled={stages.length <= 1}
                        className="inline-flex items-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove stage
                      </button>
                    </div>
                    </div>
                  );
                })() : (
                  <p className="text-sm text-slate-500">
                    Select a node on the canvas to edit metadata.
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-800">
                  Stage summary
                </h4>
                <ul className="mt-4 space-y-3 text-sm">
                  {orderedStages.map((stage, index) => {
                    const isActive = selectedStageId === stage.id;
                    const isFinal = isStageFinal(stage);
                    const statusLabel = STATUS_LABELS[stage.status] ?? stage.status;
                    return (
                      <li key={stage.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedStageId(stage.id)}
                          className={[
                            "w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
                            isActive
                              ? "border-emerald-300 bg-emerald-50 shadow-sm"
                              : "border-slate-100 bg-slate-50 hover:border-emerald-200",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                            <span>Stage {index + 1}</span>
                            <span className="flex items-center gap-2">
                              {statusLabel}
                              {isFinal ? (
                                <span className="rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                                  Final
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {stage.name}
                          </div>
                          <p className="text-xs text-slate-500">
                            {userMap[stage.actorUserId]?.name ?? "Unassigned"} ·{" "}
                            {userMap[stage.actorUserId]?.role ?? "Role pending"}
                          </p>
                          {isActive ? (
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                              Selected
                            </p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isJsonModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setIsJsonModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-950 text-slate-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex flex-col gap-2 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Flow JSON preview
                </p>
                <h3 className="text-lg font-semibold text-white">
                  Export blueprint payload
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyJson}
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/30"
                >
                  {copied ? "Copied" : "Copy JSON"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </header>
            <pre className="max-h-[500px] overflow-auto px-6 py-5 text-xs">
{previewJson}
            </pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
