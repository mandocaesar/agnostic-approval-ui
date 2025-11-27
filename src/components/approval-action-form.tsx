"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApprovalActionFormProps {
  approvalId: string;
  currentStage: {
    id: string;
    name: string;
    transitions: Array<{
      to: string;
      targetStageId?: string;
      targetStageName?: string;
      label?: string;
      isDefault?: boolean;
    }>;
  };
  flowDefinition: {
    stages: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  };
}

export function ApprovalActionForm({
  approvalId,
  currentStage,
  flowDefinition,
}: ApprovalActionFormProps) {
  const router = useRouter();
  const [action, setAction] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available actions from current stage transitions
  const availableActions = currentStage.transitions.map((transition) => {
    const targetStage = flowDefinition.stages.find(
      (s) => s.id === transition.targetStageId
    );

    let actionLabel = transition.label || "";
    if (!actionLabel) {
      if (transition.to === "approved") actionLabel = "Approve";
      else if (transition.to === "reject") actionLabel = "Reject";
      else if (targetStage) actionLabel = `Send to ${targetStage.name}`;
      else actionLabel = transition.to;
    }

    return {
      value: transition.targetStageId || transition.to,
      label: actionLabel,
      status: transition.to,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/approvals/${approvalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit action");
      }

      // Refresh the page to show updated data
      router.refresh();
      setAction("");
      setComment("");
    } catch (error) {
      console.error("Error submitting action:", error);
      alert("Failed to submit action. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Take Action</h2>
        <p className="text-sm text-slate-500 mt-1">
          Current stage: {currentStage.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Action Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Action <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-2">
            {availableActions.map((actionOption) => (
              <label
                key={actionOption.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  action === actionOption.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={actionOption.value}
                  checked={action === actionOption.value}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">
                    {actionOption.label}
                  </span>
                  {actionOption.status && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({actionOption.status})
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            placeholder="Add a comment about your decision..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!action || isSubmitting}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
            !action || isSubmitting
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Action"}
        </button>
      </form>
    </div>
  );
}
