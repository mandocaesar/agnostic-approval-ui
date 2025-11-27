"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ApprovalFlow, ApprovalStatus, Domain, StageEvent, User } from "@/types";
import StageNode, { type StageNodeData } from "./flow/stage-node";
import { StageSidebar } from "./flow/stage-sidebar";
import { TransitionEditor } from "./flow/transition-editor";
import DraggableEdge from "./flow/draggable-edge";
import type { ConditionGroup } from "@/types";
import { VersionHistory } from "./version-history";

const STATUS_OPTIONS: { value: ApprovalStatus; label: string; forceFinal?: boolean }[] = [
  { value: "in_process", label: "In Process" },
  { value: "approved", label: "Approved", forceFinal: true },
  { value: "reject", label: "Rejected", forceFinal: true },
  { value: "end", label: "End", forceFinal: true },
];

const FINAL_STATUSES = STATUS_OPTIONS.filter(
  (option) => option.forceFinal,
).map((option) => option.value);

interface RuleBuilderProps {
  users: User[];
  domains: Domain[];
  initialFlowContext?: {
    flow: ApprovalFlow;
    domain: Domain;
    subdomain: Domain["subdomains"][number];
  };
  selectedDomainId?: string;
  selectedSubdomainId?: string;
}

function isLockedFinalStatus(status: ApprovalStatus) {
  return FINAL_STATUSES.includes(status);
}

function createStageId() {
  return `stage-${Math.random().toString(36).slice(2, 8)}`;
}

const nodeTypes = {
  stage: StageNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const edgeTypes = {
  draggable: DraggableEdge,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export function RuleBuilder({
  users,
  domains,
  initialFlowContext,
  selectedDomainId,
  selectedSubdomainId,
}: RuleBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StageNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowName, setFlowName] = useState(
    initialFlowContext?.flow.name ?? "New Approval Flow"
  );
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [edgeConditions, setEdgeConditions] = useState<
    Record<string, { conditionGroups: ConditionGroup[]; isDefault: boolean }>
  >({});
  
  // Alert/Error modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });
  
  // Domain and subdomain selection state
  const [currentDomainId, setCurrentDomainId] = useState<string>(
    initialFlowContext?.domain.id ?? selectedDomainId ?? ""
  );
  const [currentSubdomainId, setCurrentSubdomainId] = useState<string>(
    initialFlowContext?.subdomain.id ?? selectedSubdomainId ?? ""
  );
  
  // Track if initial load is complete
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    nodeId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    nodeId: null,
  });
  
  // Get available subdomains based on selected domain
  const availableSubdomains = useMemo(() => {
    const domain = domains.find(d => d.id === currentDomainId);
    return domain?.subdomains ?? [];
  }, [currentDomainId, domains]);

  // Initialize from context or default
  useEffect(() => {
    if (initialFlowContext) {
      const { flow } = initialFlowContext;
      setFlowName(flow.name);
      
      // Map flow definition to nodes and edges
      const stages = flow.definition.stages || [];
      
      // Get node positions from metadata if available
      const savedPositions = flow.metadata?.layout?.nodes as Array<{ id: string; position: { x: number; y: number } }> || [];
      const positionMap = new Map(savedPositions.map(n => [n.id, n.position]));
      
      // Create nodes from stages
      const mappedNodes: Node<StageNodeData>[] = stages.map((stage, index) => ({
        id: stage.id,
        type: "stage",
        position: positionMap.get(stage.id) || { x: 100 + (index * 250), y: 100 },
        data: {
          label: stage.name,
          status: stage.status,
          description: stage.description || "",
          actorUserId: stage.actorUserId || users[0]?.id || "",
          notifySupervisor: stage.notifySupervisor ?? false,
          ccActor: stage.ccActor ?? false,
          isFinal: isLockedFinalStatus(stage.status),
          users,
          onEdit: (id) => {
            setSelectedStageId(id);
            setIsStageModalOpen(true);
          },
          transitions: stage.transitions || [],
          events: stage.events || [],
        },
      }));
      
      // Create edges from stage transitions and collect conditions
      const mappedEdges: Edge[] = [];
      const conditions: Record<string, { conditionGroups: ConditionGroup[]; isDefault: boolean }> = {};
      
      stages.forEach((stage) => {
        stage.transitions?.forEach((transition) => {
          if (transition.targetStageId) {
            const edgeId = `${stage.id}-${transition.targetStageId}`;
            mappedEdges.push({
              id: edgeId,
              source: stage.id,
              target: transition.targetStageId,
              type: "draggable",
              animated: false,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
              label: transition.label || transition.targetStageName || "",
            });
            
            // Collect edge conditions
            if (transition.conditionGroups || transition.isDefault !== undefined) {
              conditions[edgeId] = {
                conditionGroups: transition.conditionGroups || [],
                isDefault: transition.isDefault ?? false,
              };
            }
          }
        });
      });
      
      // Set all state in one batch
      setNodes(mappedNodes);
      setEdges(mappedEdges);
      setEdgeConditions(conditions);
      setIsInitialized(true);
    } else {
      // Default initial state
      const initialNodes: Node<StageNodeData>[] = [
        {
          id: "start",
          type: "stage",
          position: { x: 100, y: 100 },
          data: {
            label: "Draft business case",
            status: "in_process",
            description: "Initial draft stage",
            actorUserId: users[0]?.id ?? "",
            notifySupervisor: true,
            ccActor: true,
            isFinal: false,
            users,
            onEdit: (id) => {
              setSelectedStageId(id);
              setIsStageModalOpen(true);
            },
          },
        },
      ];
      setNodes(initialNodes);
      setIsInitialized(true);
    }
    // Only run on mount or when initialFlowContext changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFlowContext?.flow.id]);




  // Sync edges to node transitions (skip during initial load to prevent interference)
  useEffect(() => {
    if (!isInitialized) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        const nodeTransitions = edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => edge.target);

        // Only update if changed to avoid infinite loops
        const currentTransitions = node.data.transitions || [];
        const hasChanged =
          nodeTransitions.length !== currentTransitions.length ||
          !nodeTransitions.every((t) => currentTransitions.includes(t));

        if (hasChanged) {
          return {
            ...node,
            data: {
              ...node.data,
              transitions: nodeTransitions,
            },
          };
        }
        return node;
      })
    );
  }, [edges, setNodes, isInitialized]);
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === params.source) {
            const currentTransitions = node.data.transitions || [];
            if (!currentTransitions.includes(params.target)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  transitions: [...currentTransitions, params.target],
                },
              };
            }
          }
          return node;
        })
      );
    },
    [setEdges, setNodes],
  );


  const handleStageEdit = useCallback((id: string) => {
    setSelectedStageId(id);
    setIsStageModalOpen(true);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu.nodeId) return;
    
    setNodes((nds) => nds.filter((node) => node.id !== contextMenu.nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== contextMenu.nodeId && edge.target !== contextMenu.nodeId
    ));
    setContextMenu({ isOpen: false, x: 0, y: 0, nodeId: null });
  }, [contextMenu.nodeId, setNodes, setEdges]);

  const handleEditNode = useCallback(() => {
    if (!contextMenu.nodeId) return;
    
    setSelectedStageId(contextMenu.nodeId);
    setIsStageModalOpen(true);
    setContextMenu({ isOpen: false, x: 0, y: 0, nodeId: null });
  }, [contextMenu.nodeId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.isOpen) {
        setContextMenu({ isOpen: false, x: 0, y: 0, nodeId: null });
      }
    };
    
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.isOpen]);

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setIsTransitionModalOpen(true);
  }, []);

  const handleConditionSave = useCallback(
    (data: { conditionGroups: ConditionGroup[]; isDefault: boolean }) => {
      if (!selectedEdgeId) return;

      setEdgeConditions((prev) => ({
        ...prev,
        [selectedEdgeId]: data,
      }));
    },
    [selectedEdgeId]
  );



  // Update node data when users or handleStageEdit changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          users,
          onEdit: handleStageEdit,
        },
      }))
    );
  }, [users, handleStageEdit, setNodes]);

  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewJson = useMemo(() => {
    const flowData = {
      name: flowName,
      nodes: nodes.map(({ id, position, data }) => ({
        id,
        position,
        data: {
          label: data.label,
          status: data.status,
          description: data.description,
          actorUserId: data.actorUserId,
          notifySupervisor: data.notifySupervisor,
          ccActor: data.ccActor,
          isFinal: data.isFinal,
        },
      })),
      edges,
    };
    return JSON.stringify(flowData, null, 2);
  }, [flowName, nodes, edges]);

  const copyJson = () => {
    navigator.clipboard.writeText(previewJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const templateData = event.dataTransfer.getData('stage-template');
      if (!templateData) return;

      const template = JSON.parse(templateData);

      // Validate unique terminal nodes (draft, approved, rejected)
      if (template.id === 'draft') {
        const hasDraft = nodes.some(node => node.data.label.toLowerCase() === 'draft');
        if (hasDraft) {
          setAlertModal({
            isOpen: true,
            title: 'Validation Error',
            message: 'Flow can only have one Draft node',
            type: 'warning',
          });
          return;
        }
      }

      if (template.status === 'approved') {
        const hasApproved = nodes.some(node => node.data.status === 'approved');
        if (hasApproved) {
          setAlertModal({
            isOpen: true,
            title: 'Validation Error',
            message: 'Flow can only have one Approved node',
            type: 'warning',
          });
          return;
        }
      }

      if (template.status === 'reject') {
        const hasRejected = nodes.some(node => node.data.status === 'reject');
        if (hasRejected) {
          setAlertModal({
            isOpen: true,
            title: 'Validation Error',
            message: 'Flow can only have one Rejected node',
            type: 'warning',
          });
          return;
        }
      }

      // Use ReactFlow's screenToFlowPosition for accurate positioning
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = createStageId();
      const newNode: Node<StageNodeData> = {
        id,
        type: 'stage',
        position,
        data: {
          label: template.label,
          status: template.status,
          description: template.description,
          actorUserId: users[0]?.id ?? '',
          notifySupervisor: false,
          ccActor: false,
          isFinal: template.status === 'approved' || template.status === 'end',
          users,
          onEdit: handleStageEdit,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [users, handleStageEdit, setNodes, nodes, screenToFlowPosition, setAlertModal]
  );

  const validateFlow = useCallback(() => {
    const errors: string[] = [];

    // Check for orphaned nodes (no incoming or outgoing connections)
    const connectedNodes = new Set<string>();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphanedNodes = nodes.filter(
      (node) => !connectedNodes.has(node.id) && nodes.length > 1
    );

    if (orphanedNodes.length > 0) {
      errors.push(
        `Orphaned nodes detected: ${orphanedNodes.map((n) => n.data.label).join(', ')}`
      );
    }

    // Check for at least one node
    if (nodes.length === 0) {
      errors.push('Flow must have at least one stage');
    }

    return { isValid: errors.length === 0, errors };
  }, [nodes, edges]);

  const handleSave = useCallback(async () => {
    const validation = validateFlow();

    if (!validation.isValid) {
      setAlertModal({
        isOpen: true,
        title: 'Validation Error',
        message: `Cannot save flow:\n\n${validation.errors.join('\n')}`,
        type: 'error',
      });
      return;
    }

    // Validate domain and subdomain selection
    if (!currentDomainId || !currentSubdomainId) {
      setAlertModal({
        isOpen: true,
        title: 'Missing Selection',
        message: 'Please select both a domain and subdomain before saving the flow.',
        type: 'warning',
      });
      return;
    }

    // Generate the flow definition
    const flowDefinition = {
      stages: nodes.map((node) => {
        // Get edges for this node to build proper transitions
        const nodeEdges = edges.filter(edge => edge.source === node.id);
        const transitions: FlowTransition[] = nodeEdges.map(edge => {
          const targetNode = nodes.find(n => n.id === edge.target);
          const edgeCondition = edgeConditions[edge.id];
          
          return {
            to: targetNode?.data.status || "in_process",
            targetStageId: edge.target,
            targetStageName: targetNode?.data.label || "",
            targetStageStatus: targetNode?.data.status,
            label: (typeof edge.label === 'string' ? edge.label : '') || targetNode?.data.label || "",
            conditionGroups: edgeCondition?.conditionGroups || [],
            isDefault: edgeCondition?.isDefault ?? false,
          };
        });
        
        return {
          id: node.id,
          name: node.data.label,
          status: node.data.status,
          description: node.data.description,
          actorUserId: node.data.actorUserId,
          notifySupervisor: node.data.notifySupervisor,
          ccActor: node.data.ccActor,
          isFinal: node.data.isFinal,
          events: node.data.events || [],
          transitions,
        };
      }),
    };

    const flowData = {
      name: flowName,
      version: initialFlowContext?.flow.version || '1.0.0',
      description: 'Created with visual workflow designer',
      subdomainId: currentSubdomainId,
      definition: flowDefinition,
      metadata: {
        layout: {
          nodes: nodes.map(({ id, position }) => ({ id, position })),
        },
      },
    };

    try {
      const url = initialFlowContext
        ? `/api/flows/${initialFlowContext.flow.id}`
        : '/api/flows';
      
      const method = initialFlowContext ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.statusText}`);
      }

      const savedFlow = await response.json();
      console.log('Saved flow:', savedFlow);
      
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: initialFlowContext 
          ? 'Flow updated successfully!' 
          : 'Flow created successfully!',
        type: 'success',
      });
      
      // If creating a new flow, update to edit mode without redirecting
      if (!initialFlowContext && savedFlow) {
        // Update URL without page reload to show we're now editing
        window.history.replaceState(null, '', `/dashboard/rules/${savedFlow.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: `Error saving flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    }
  }, [flowName, nodes, validateFlow, currentDomainId, currentSubdomainId, initialFlowContext]);

  return (
    <section className="flex h-[calc(100vh-100px)]">
      <StageSidebar />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{flowName}</h1>
              <p className="text-sm text-slate-500">
                Click edge → Drag label or blue dot → Double-click to edit → Delete to remove
              </p>
            </div>
            <div className="flex gap-2">
              {initialFlowContext && (
                <VersionHistory
                  flowId={initialFlowContext.flow.id}
                  currentVersion={initialFlowContext.flow.version}
                  onRestore={() => {
                    // Reload the page to fetch the restored version
                    window.location.reload();
                  }}
                />
              )}
              <button
                onClick={() => setIsJsonModalOpen(true)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
              >
                View JSON
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                💾 Save Flow
              </button>
            </div>
          </div>
          
          {/* Domain and Subdomain Selection */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Domain
              </label>
              <select
                value={currentDomainId}
                onChange={(e) => {
                  setCurrentDomainId(e.target.value);
                  setCurrentSubdomainId(""); // Reset subdomain when domain changes
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select a domain...</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subdomain
              </label>
              <select
                value={currentSubdomainId}
                onChange={(e) => setCurrentSubdomainId(e.target.value)}
                disabled={!currentDomainId || availableSubdomains.length === 0}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a subdomain...</option>
                {availableSubdomains.map((subdomain) => (
                  <option key={subdomain.id} value={subdomain.id}>
                    {subdomain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Flow Name
              </label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Enter flow name..."
              />
            </div>
          </div>
        </header>

        <div className="flex-1 w-full h-full bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges.map((edge) => {
              const hasConditions = edgeConditions[edge.id]?.conditionGroups?.length > 0;
              const isDefault = edgeConditions[edge.id]?.isDefault;

              // Determine label text
              let label: string;
              if (isDefault) {
                label = "DEFAULT";
              } else if (hasConditions) {
                label = `${edgeConditions[edge.id].conditionGroups.length} rule(s)`;
              } else {
                label = "Click to add condition";
              }

              // Determine colors based on edge type
              let strokeColor: string;
              let labelColor: string;
              let labelBgColor: string;

              if (isDefault) {
                strokeColor = '#6366f1'; // Indigo for default
                labelColor = '#4f46e5';
                labelBgColor = '#e0e7ff';
              } else if (hasConditions) {
                strokeColor = '#059669'; // Emerald for conditional
                labelColor = '#059669';
                labelBgColor = '#d1fae5';
              } else {
                strokeColor = '#94a3b8'; // Slate for unconfigured
                labelColor = '#64748b';
                labelBgColor = '#f1f5f9';
              }

              return {
                ...edge,
                type: 'draggable', // Use draggable edge type
                animated: isDefault,
                data: {
                  ...edge.data,
                  label,
                  labelColor,
                  labelBgColor,
                  strokeColor,
                  animated: isDefault,
                },
                style: {
                  stroke: strokeColor,
                  strokeWidth: 2,
                },
              };
            })}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{
              type: 'draggable',
              animated: false,
            }}
            deleteKeyCode="Delete"
            fitView
            minZoom={0.5}
            maxZoom={2}
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden" />
            <MiniMap
              position="bottom-right"
              className="!bottom-4 !right-4 border border-slate-200 shadow-sm rounded-lg overflow-hidden bg-white"
              nodeColor={(n: Node) => {
                if (n.type === "stage") return "#10b981";
                return "#eee";
              }}
              style={{ width: 200, height: 150 }}
            />
          </ReactFlow>
          
          {/* Context Menu */}
          {contextMenu.isOpen && (
            <div
              className="fixed z-50 bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden min-w-[140px]"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
              }}
            >
              <button
                onClick={handleEditNode}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <div className="border-t border-slate-100"></div>
              <button
                onClick={handleDeleteNode}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stage Editor Modal */}
      {isStageModalOpen && selectedStageId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setIsStageModalOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Stage editor
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
            <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-2">
              {(() => {
                const selectedNode = nodes.find((n) => n.id === selectedStageId);
                if (!selectedNode) return null;

                const stage = selectedNode.data;
                const stageIsFinal = stage.isFinal;
                const statusLockedFinal = isLockedFinalStatus(stage.status);

                const updateStage = (updates: Partial<StageNodeData>) => {
                  setNodes((nds) =>
                    nds.map((node) => {
                      if (node.id === selectedStageId) {
                        return {
                          ...node,
                          data: { ...node.data, ...updates },
                        };
                      }
                      return node;
                    })
                  );
                };

                return (
                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Stage name
                        <input
                          type="text"
                          value={stage.label}
                          onChange={(event) =>
                            updateStage({ label: event.target.value })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        />
                      </label>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                        <select
                          value={stage.status}
                          onChange={(event) =>
                            updateStage({ status: event.target.value as ApprovalStatus })
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
                        value={stage.description}
                        onChange={(event) =>
                          updateStage({ description: event.target.value })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actor
                      <select
                        value={stage.actorUserId}
                        onChange={(event) =>
                          updateStage({ actorUserId: event.target.value })
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
                            updateStage({ isFinal: event.target.checked })
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </label>
                      {statusLockedFinal ? (
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Approved and End nodes always complete the flow.
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] font-normal text-slate-500">
                          Final states complete the flow.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Notifications
                      <label className="flex items-center gap-2 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={stage.notifySupervisor}
                          onChange={(event) =>
                            updateStage({ notifySupervisor: event.target.checked })
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Notify supervisor
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={stage.ccActor}
                          onChange={(event) =>
                            updateStage({ ccActor: event.target.checked })
                          }
                          className="h-4 w-4 rounded border border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        CC actor
                      </label>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Event Publishing
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newEvent: StageEvent = {
                              id: crypto.randomUUID(),
                              type: "webhook",
                              enabled: true,
                              config: {
                                method: "POST",
                                url: "",
                                headers: { "Content-Type": "application/json" },
                              },
                            };
                            updateStage({
                              events: [...(stage.events || []), newEvent],
                            });
                          }}
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          + Add Event
                        </button>
                      </div>

                      {(stage.events || []).map((event: StageEvent, index: number) => (
                        <div key={event.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <select
                                value={event.type}
                                onChange={(e) => {
                                  const newEvents = [...(stage.events || [])];
                                  newEvents[index] = {
                                    ...event,
                                    type: e.target.value as "webhook" | "kafka",
                                    config: e.target.value === "kafka"
                                      ? { topic: "" }
                                      : { method: "POST", url: "" }
                                  };
                                  updateStage({ events: newEvents });
                                }}
                                className="rounded border border-slate-200 px-2 py-1 text-xs"
                              >
                                <option value="webhook">Webhook</option>
                                <option value="kafka">Kafka</option>
                              </select>
                              <label className="flex items-center gap-1 text-[10px] text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={event.enabled}
                                  onChange={(e) => {
                                    const newEvents = [...(stage.events || [])];
                                    newEvents[index] = { ...event, enabled: e.target.checked };
                                    updateStage({ events: newEvents });
                                  }}
                                  className="h-3 w-3 rounded border-slate-300"
                                />
                                Enabled
                              </label>
                            </div>
                            <button
                              onClick={() => {
                                const newEvents = (stage.events || []).filter((_: StageEvent, i: number) => i !== index);
                                updateStage({ events: newEvents });
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-600"
                            >
                              Remove
                            </button>
                          </div>

                          {event.type === "webhook" && (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <select
                                  value={event.config.method}
                                  onChange={(e) => {
                                    const newEvents = [...(stage.events || [])];
                                    newEvents[index].config.method = e.target.value as "GET" | "POST" | "PUT" | "PATCH";
                                    updateStage({ events: newEvents });
                                  }}
                                  className="w-20 rounded border border-slate-200 px-2 py-1 text-xs"
                                >
                                  <option value="POST">POST</option>
                                  <option value="PUT">PUT</option>
                                  <option value="GET">GET</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="https://api.example.com/webhook"
                                  value={event.config.url || ""}
                                  onChange={(e) => {
                                    const newEvents = [...(stage.events || [])];
                                    newEvents[index].config.url = e.target.value;
                                    updateStage({ events: newEvents });
                                  }}
                                  className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                              </div>
                            </div>
                          )}

                          {event.type === "kafka" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Topic Name"
                                value={event.config.topic || ""}
                                onChange={(e) => {
                                  const newEvents = [...(stage.events || [])];
                                  newEvents[index].config.topic = e.target.value;
                                  updateStage({ events: newEvents });
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* JSON Preview Modal */}
      {isJsonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setIsJsonModalOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col bg-slate-950 text-slate-100 shadow-2xl"
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
            <pre className="flex-1 overflow-auto px-6 py-5 text-xs font-mono">
              {previewJson}
            </pre>
          </div>
        </div>
      )}

      {/* Transition Editor Modal */}
      {isTransitionModalOpen && selectedEdgeId && (() => {
        const edge = edges.find((e) => e.id === selectedEdgeId);
        if (!edge) return null;

        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        return (
          <TransitionEditor
            edgeId={selectedEdgeId}
            sourceLabel={sourceNode?.data.label || 'Source'}
            targetLabel={targetNode?.data.label || 'Target'}
            conditionGroups={edgeConditions[selectedEdgeId]?.conditionGroups}
            isDefault={edgeConditions[selectedEdgeId]?.isDefault}
            onSave={handleConditionSave}
            onClose={() => setIsTransitionModalOpen(false)}
          />
        );
      })()}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
          onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                {alertModal.type === 'success' && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {alertModal.type === 'error' && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {alertModal.type === 'warning' && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{alertModal.title}</h3>
              </div>
              <p className="mb-6 whitespace-pre-line text-sm text-slate-600">{alertModal.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

