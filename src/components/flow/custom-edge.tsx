import { useCallback } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath,
    useReactFlow,
} from '@xyflow/react';

export type CustomEdgeData = {
    label?: string;
    labelColor?: string;
    labelBgColor?: string;
    strokeColor?: string;
    animated?: boolean;
};

export default function CustomEdge({
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
}: EdgeProps<CustomEdgeData>) {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeClick = useCallback(() => {
        // This will be handled by the parent component's onEdgeClick
    }, []);

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    strokeWidth: 2,
                    cursor: 'pointer',
                    ...(style || {}),
                }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 11,
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
                        onClick={onEdgeClick}
                    >
                        {data?.label || 'Click to add condition'}
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
