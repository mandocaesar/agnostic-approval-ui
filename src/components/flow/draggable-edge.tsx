import { useCallback, useState } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    useReactFlow,
} from '@xyflow/react';

export type DraggableEdgeData = {
    label?: string;
    labelColor?: string;
    labelBgColor?: string;
    strokeColor?: string;
    animated?: boolean;
    waypoint?: { x: number; y: number };
};

export default function DraggableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}: EdgeProps<DraggableEdgeData>) {
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const [isDraggingWaypoint, setIsDraggingWaypoint] = useState(false);

    // Calculate default waypoint position
    const defaultWaypoint = {
        x: (sourceX + targetX) / 2,
        y: (sourceY + targetY) / 2,
    };

    const waypoint = data?.waypoint || defaultWaypoint;

    // Create orthogonal path through waypoint
    // M sx sy -> L wx sy -> L wx wy -> L tx wy -> L tx ty
    // This creates a stepped path with right angles that passes through the waypoint
    const edgePath = `M ${sourceX} ${sourceY} L ${waypoint.x} ${sourceY} L ${waypoint.x} ${waypoint.y} L ${targetX} ${waypoint.y} L ${targetX} ${targetY}`;

    const handleWaypointDrag = useCallback(
        (event: React.MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            setIsDraggingWaypoint(true);

            const handleMouseMove = (e: MouseEvent) => {
                e.preventDefault();

                const position = screenToFlowPosition({
                    x: e.clientX,
                    y: e.clientY,
                });

                setEdges((edges) =>
                    edges.map((edge) => {
                        if (edge.id === id) {
                            return {
                                ...edge,
                                data: {
                                    ...edge.data,
                                    waypoint: { x: position.x, y: position.y },
                                },
                            };
                        }
                        return edge;
                    })
                );
            };

            const handleMouseUp = () => {
                setIsDraggingWaypoint(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [id, setEdges, screenToFlowPosition]
    );

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: 2,
                    cursor: 'pointer',
                    strokeLinejoin: 'round', // Round corners for smoother look
                    strokeLinecap: 'round',
                    ...style,
                }}
            />

            {/* Waypoint handle - only show when edge is selected */}
            {selected && (
                <g className="waypoint-handle">
                    <circle
                        cx={waypoint.x}
                        cy={waypoint.y}
                        r={8}
                        fill="#3b82f6"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{
                            cursor: isDraggingWaypoint ? 'grabbing' : 'grab',
                            pointerEvents: 'all',
                        }}
                        onMouseDown={handleWaypointDrag}
                    />
                    <circle
                        cx={waypoint.x}
                        cy={waypoint.y}
                        r={3}
                        fill="#fff"
                        style={{
                            pointerEvents: 'none',
                        }}
                    />
                </g>
            )}

            {/* Label - only show when edge is NOT selected */}
            {!selected && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${waypoint.x}px,${waypoint.y}px)`,
                            fontSize: 12,
                            fontWeight: 600,
                            pointerEvents: 'all',
                            cursor: 'pointer',
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            style={{
                                background: data?.labelBgColor || '#f1f5f9',
                                color: data?.labelColor || '#64748b',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            {data?.label || 'Click to add condition'}
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
