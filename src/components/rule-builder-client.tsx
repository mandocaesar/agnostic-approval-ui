"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { RuleBuilder as RuleBuilderType } from "./rule-builder";
import { ReactFlowProvider } from "@xyflow/react";

const RuleBuilder = dynamic(
    () => import("./rule-builder").then((mod) => mod.RuleBuilder),
    { ssr: false },
);

export function RuleBuilderClient(props: ComponentProps<typeof RuleBuilderType>) {
    return (
        <ReactFlowProvider>
            <RuleBuilder {...props} />
        </ReactFlowProvider>
    );
}
