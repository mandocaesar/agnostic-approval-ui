# Usage Guide: Production-Ready Components & Utilities

This guide shows you how to use all the new production-ready components, hooks, and utilities.

---

## Table of Contents

1. [API Hooks](#api-hooks)
2. [Form Components](#form-components)
3. [Button Components](#button-components)
4. [Validation](#validation)
5. [UI Feedback](#ui-feedback)
6. [Complete Examples](#complete-examples)

---

## API Hooks

### 1. useFetch - For GET Requests

**Basic Usage:**
```typescript
import { useFetch } from "@/hooks/use-api";

function ApprovalList() {
  const { data, loading, error, refetch } = useFetch<Approval[]>('/api/approvals');

  if (loading) return <PageLoader />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map(approval => (
        <ApprovalCard key={approval.id} approval={approval} />
      ))}
      <Button onClick={refetch}>Refresh</Button>
    </div>
  );
}
```

**With Query Parameters:**
```typescript
const domainId = "domain-123";
const { data } = useFetch<Approval[]>(
  () => `/api/approvals?domainId=${domainId}&status=pending`
);
```

**With Options:**
```typescript
const { data, loading } = useFetch<User>('/api/users/me', {
  onSuccess: (user) => {
    console.log('User loaded:', user.name);
  },
  onError: (error) => {
    console.error('Failed to load user:', error);
  },
});
```

### 2. useMutation - For POST/PUT/DELETE

**Create Operation:**
```typescript
import { useMutation } from "@/hooks/use-api";

function CreateApprovalButton() {
  const router = useRouter();

  const { mutate, loading } = useMutation<Approval, ApprovalInput>(
    (data) => fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    {
      successMessage: "Approval created successfully!",
      errorMessage: "Failed to create approval",
      onSuccess: (approval) => {
        router.push(`/approvals/${approval.id}`);
      },
    }
  );

  const handleCreate = () => {
    mutate({
      title: "New Approval",
      domainId: "domain-123",
      requesterId: "user-456",
    });
  };

  return (
    <Button onClick={handleCreate} loading={loading}>
      Create Approval
    </Button>
  );
}
```

**Update Operation:**
```typescript
const { mutate: updateApproval, loading } = useMutation<Approval, Partial<Approval>>(
  (data) => fetch(`/api/approvals/${approvalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
  { successMessage: "Updated!" }
);
```

**Delete Operation:**
```typescript
const { mutate: deleteApproval } = useMutation<void, string>(
  (id) => fetch(`/api/approvals/${id}`, { method: 'DELETE' }),
  {
    successMessage: "Deleted successfully",
    onSuccess: () => router.push('/approvals'),
  }
);

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Approval",
    message: "This action cannot be undone",
    type: "danger",
  });

  if (confirmed) {
    deleteApproval(approvalId);
  }
};
```

### 3. useApi - For Custom API Calls

```typescript
import { useApi } from "@/hooks/use-api";

function ApproveButton({ approvalId }: { approvalId: string }) {
  const { execute, loading } = useApi(
    async () => {
      const res = await fetch(`/api/approvals/${approvalId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      return res;
    },
    {
      successMessage: "Approval approved!",
      onSuccess: () => {
        // Refresh page or update state
        window.location.reload();
      },
    }
  );

  return (
    <Button onClick={execute} loading={loading} variant="success">
      Approve
    </Button>
  );
}
```

---

## Form Components

### 1. Input Component

**Basic Input:**
```tsx
import { Input } from "@/components/ui/input";

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>
```

**With Error:**
```tsx
<Input
  label="Title"
  value={formData.title}
  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
  error={errors.title}
  hint="Enter a descriptive title"
  required
/>
```

**With Icons:**
```tsx
<Input
  label="Search"
  placeholder="Search approvals..."
  leftIcon={
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  }
/>
```

### 2. Textarea Component

```tsx
import { Textarea } from "@/components/ui/input";

<Textarea
  label="Description"
  rows={4}
  placeholder="Enter description..."
  error={errors.description}
  hint="Provide details about the approval"
  required
/>
```

### 3. Select Component

```tsx
import { Select } from "@/components/ui/input";

<Select
  label="Status"
  options={[
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ]}
  placeholder="Select status"
  value={formData.status}
  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
  error={errors.status}
  required
/>
```

### 4. Checkbox Component

```tsx
import { Checkbox } from "@/components/ui/input";

<Checkbox
  label="Send notifications"
  description="Notify all approvers via email"
  checked={formData.notify}
  onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
/>
```

### 5. FormGroup Component

```tsx
import { FormGroup } from "@/components/ui/input";

<FormGroup>
  <Input label="First Name" />
  <Input label="Last Name" />
  <Input label="Email" type="email" />
  <Textarea label="Bio" />
</FormGroup>
```

---

## Button Components

### 1. Button Component

**Variants:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Approve</Button>
<Button variant="ghost">Cancel</Button>
```

**Sizes:**
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

**With Loading:**
```tsx
<Button loading={saving} loadingText="Saving...">
  Save Changes
</Button>
```

**With Icons:**
```tsx
<Button
  leftIcon={
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  }
>
  Add New
</Button>
```

**Full Width:**
```tsx
<Button fullWidth>Sign In</Button>
```

### 2. IconButton Component

```tsx
import { IconButton } from "@/components/ui/button";

<IconButton aria-label="Delete" onClick={handleDelete}>
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
</IconButton>
```

### 3. ButtonGroup Component

```tsx
import { ButtonGroup } from "@/components/ui/button";

<ButtonGroup>
  <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
  <Button onClick={handleSave}>Save</Button>
</ButtonGroup>
```

### 4. SubmitButton Component

```tsx
import { SubmitButton } from "@/components/ui/button";

<form onSubmit={handleSubmit}>
  <Input label="Name" />
  <SubmitButton loading={submitting}>Submit</SubmitButton>
</form>
```

---

## Validation

### 1. Built-in Rules

```typescript
import { ValidationRules } from "@/lib/validation";

const rules = [
  ValidationRules.required(),
  ValidationRules.email(),
  ValidationRules.minLength(8),
  ValidationRules.maxLength(100),
  ValidationRules.min(0),
  ValidationRules.max(1000),
  ValidationRules.pattern(/^[A-Z]/, "Must start with capital letter"),
  ValidationRules.url(),
  ValidationRules.phone(),
  ValidationRules.numeric(),
  ValidationRules.alphanumeric(),
];
```

### 2. Field Validation

```typescript
import { validateFields } from "@/lib/validation";

const validation = validateFields({
  email: {
    value: formData.email,
    rules: [ValidationRules.required(), ValidationRules.email()]
  },
  password: {
    value: formData.password,
    rules: [ValidationRules.required(), ValidationRules.minLength(8)]
  },
  confirmPassword: {
    value: formData.confirmPassword,
    rules: [
      ValidationRules.required(),
      ValidationRules.match(formData.password, "Password")
    ]
  },
});

if (!validation.isValid) {
  setErrors(validation.errors);
  return;
}
```

### 3. Reusable Validator

```typescript
import { createValidator } from "@/lib/validation";

const validateApproval = createValidator({
  title: [ValidationRules.required(), ValidationRules.minLength(3)],
  amount: [ValidationRules.required(), ValidationRules.min(0)],
  description: [ValidationRules.maxLength(500)],
});

// Use in form
const result = validateApproval(formData);
if (!result.isValid) {
  setErrors(result.errors);
}
```

### 4. Custom Validation

```typescript
const customRule = ValidationRules.custom(
  (value: string) => value.includes('@company.com'),
  "Must be a company email"
);

const rules = [
  ValidationRules.required(),
  ValidationRules.email(),
  customRule,
];
```

### 5. XSS Protection

```typescript
import { sanitizeInput, validateAndSanitize } from "@/lib/validation";

// Simple sanitization
const clean = sanitizeInput(userInput);

// Validate and sanitize together
const result = validateAndSanitize(formData, {
  title: [ValidationRules.required()],
  description: [ValidationRules.maxLength(500)],
});

if (result.isValid) {
  // Use result.sanitizedData (safe from XSS)
  await saveData(result.sanitizedData);
}
```

---

## UI Feedback

### 1. Toast Notifications

```typescript
import { toast } from "@/components/ui/toast";

// Success
toast.success("Approval created successfully!");

// Error
toast.error("Failed to create approval");

// Warning
toast.warning("This action cannot be undone");

// Info
toast.info("Your request is being processed");

// Custom duration
toast.success("Saved!", 3000); // 3 seconds

// Dismiss all
toast.dismissAll();
```

### 2. Confirmation Dialog

```typescript
import { confirm } from "@/components/ui/confirmation-dialog";

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Delete Approval",
    message: "Are you sure you want to delete this approval? This action cannot be undone.",
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger", // or "warning" or "info"
  });

  if (confirmed) {
    await deleteApproval(id);
    toast.success("Deleted");
  }
};
```

### 3. Loading States

```typescript
import { PageLoader, Spinner, InlineLoader, SkeletonCard } from "@/components/ui/loading";

// Full page loading
{loading && <PageLoader />}

// Inline spinner
{saving && <Spinner size="sm" />}

// With text
<InlineLoader text="Saving..." />

// Skeleton placeholder
{loading ? <SkeletonCard /> : <DataCard data={data} />}
```

---

## Complete Examples

### Example 1: Create Approval Form

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@/hooks/use-api";
import { validateFields, ValidationRules } from "@/lib/validation";
import { Input, Textarea, Select, FormGroup } from "@/components/ui/input";
import { Button, ButtonGroup } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

interface ApprovalFormData {
  title: string;
  description: string;
  domainId: string;
  amount: number;
}

export default function CreateApprovalForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ApprovalFormData>({
    title: "",
    description: "",
    domainId: "",
    amount: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate, loading } = useMutation<Approval, ApprovalFormData>(
    (data) => fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    {
      successMessage: "Approval created successfully!",
      onSuccess: (approval) => {
        router.push(`/approvals/${approval.id}`);
      },
      onError: (error) => {
        toast.error(`Failed: ${error.message}`);
      },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateFields({
      title: {
        value: formData.title,
        rules: [ValidationRules.required(), ValidationRules.minLength(3)],
      },
      description: {
        value: formData.description,
        rules: [ValidationRules.maxLength(500)],
      },
      domainId: {
        value: formData.domainId,
        rules: [ValidationRules.required()],
      },
      amount: {
        value: formData.amount,
        rules: [ValidationRules.required(), ValidationRules.min(0)],
      },
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error("Please fix the errors");
      return;
    }

    setErrors({});
    await mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Approval</h1>

      <FormGroup>
        <Input
          label="Title"
          placeholder="Enter approval title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        <Textarea
          label="Description"
          placeholder="Enter description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={errors.description}
          hint="Maximum 500 characters"
        />

        <Select
          label="Domain"
          placeholder="Select domain"
          options={[
            { value: "domain-1", label: "Finance" },
            { value: "domain-2", label: "HR" },
            { value: "domain-3", label: "IT" },
          ]}
          value={formData.domainId}
          onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
          error={errors.domainId}
          required
        />

        <Input
          label="Amount"
          type="number"
          min={0}
          placeholder="0.00"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          error={errors.amount}
          required
        />

        <ButtonGroup>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Approval
          </Button>
        </ButtonGroup>
      </FormGroup>
    </form>
  );
}
```

### Example 2: Approval List with Actions

```tsx
"use client";

import { useFetch, useMutation } from "@/hooks/use-api";
import { Button, IconButton } from "@/components/ui/button";
import { PageLoader, SkeletonCard } from "@/components/ui/loading";
import { confirm } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";

export default function ApprovalList() {
  const { data: approvals, loading, refetch } = useFetch<Approval[]>('/api/approvals');

  const { mutate: deleteApproval } = useMutation<void, string>(
    (id) => fetch(`/api/approvals/${id}`, { method: 'DELETE' }),
    {
      successMessage: "Approval deleted",
      onSuccess: () => refetch(),
    }
  );

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: "Delete Approval",
      message: `Are you sure you want to delete "${title}"?`,
      confirmText: "Delete",
      type: "danger",
    });

    if (confirmed) {
      await deleteApproval(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!approvals || approvals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No approvals found</p>
        <Button className="mt-4" onClick={() => router.push('/approvals/new')}>
          Create First Approval
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <div key={approval.id} className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <h3 className="font-semibold">{approval.title}</h3>
            <p className="text-sm text-slate-600">{approval.description}</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/approvals/${approval.id}`)}
            >
              View
            </Button>

            <IconButton
              aria-label="Delete"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(approval.id, approval.title)}
            >
              <TrashIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Approval Action Buttons

```tsx
"use client";

import { useMutation } from "@/hooks/use-api";
import { Button, ButtonGroup } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirmation-dialog";
import { toast } from "@/components/ui/toast";

interface ApprovalActionsProps {
  approvalId: string;
  onSuccess?: () => void;
}

export function ApprovalActions({ approvalId, onSuccess }: ApprovalActionsProps) {
  const { mutate: performAction, loading } = useMutation<Approval, { action: string }>(
    (data) => fetch(`/api/approvals/${approvalId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    {
      onSuccess: (approval) => {
        onSuccess?.();
      },
    }
  );

  const handleApprove = async () => {
    await performAction({ action: 'approve' });
    toast.success("Approval approved!");
  };

  const handleReject = async () => {
    const confirmed = await confirm({
      title: "Reject Approval",
      message: "Are you sure you want to reject this approval?",
      confirmText: "Reject",
      type: "danger",
    });

    if (confirmed) {
      await performAction({ action: 'reject' });
      toast.success("Approval rejected");
    }
  };

  return (
    <ButtonGroup>
      <Button
        variant="danger"
        onClick={handleReject}
        loading={loading}
      >
        Reject
      </Button>
      <Button
        variant="success"
        onClick={handleApprove}
        loading={loading}
      >
        Approve
      </Button>
    </ButtonGroup>
  );
}
```

---

## Best Practices

### 1. Always Validate User Input
```typescript
// ✅ Good
const validation = validateFields({...});
if (!validation.isValid) {
  setErrors(validation.errors);
  return;
}

// ❌ Bad
// No validation, directly submit
```

### 2. Show Loading States
```typescript
// ✅ Good
<Button loading={saving}>Save</Button>

// ❌ Bad
<button disabled={saving}>Save</button>
```

### 3. Provide Error Feedback
```typescript
// ✅ Good
<Input error={errors.email} />
toast.error("Failed to save");

// ❌ Bad
// Silent failures
```

### 4. Confirm Destructive Actions
```typescript
// ✅ Good
const confirmed = await confirm({ type: "danger", ... });
if (confirmed) { /* delete */ }

// ❌ Bad
// Direct delete without confirmation
```

### 5. Use Accessibility Features
```typescript
// ✅ Good
<IconButton aria-label="Delete">
  <TrashIcon />
</IconButton>

// ❌ Bad
<button><TrashIcon /></button>
```

---

## Migration Guide

### From Old Pattern to New

**Before:**
```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/approvals', { method: 'POST', body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed');
    const approval = await res.json();
    alert('Success!');
    router.push(`/approvals/${approval.id}`);
  } catch (error) {
    alert('Error!');
  } finally {
    setLoading(false);
  }
};
```

**After:**
```tsx
const { mutate, loading } = useMutation<Approval>(
  (data) => fetch('/api/approvals', { method: 'POST', body: JSON.stringify(data) }),
  {
    successMessage: "Created!",
    onSuccess: (approval) => router.push(`/approvals/${approval.id}`),
  }
);

const handleSubmit = () => mutate(data);
```

---

## Troubleshooting

### Toast Not Showing
Make sure `<ToastContainer />` is in your layout:
```tsx
// src/app/(dashboard)/layout-client.tsx
<ToastContainer />
```

### Validation Not Working
Check that you're using the correct field names:
```typescript
// Field name in validateFields must match formData key
validateFields({
  email: { value: formData.email, ... }, // ✅ Matches
  emailAddress: { value: formData.email, ... }, // ❌ Doesn't match
});
```

### Button Loading State Stuck
Ensure error handling doesn't block loading state reset:
```typescript
const { mutate, loading } = useMutation(...);

// The hook automatically resets loading state on error
```

---

## Summary

You now have a complete set of production-ready components and utilities:

- ✅ **API Hooks** - Type-safe, automatic error handling
- ✅ **Form Components** - Accessible, validated inputs
- ✅ **Button Components** - Consistent, with loading states
- ✅ **Validation** - Comprehensive rules, XSS protection
- ✅ **UI Feedback** - Toasts, confirmations, loading states

**Result:** Less boilerplate, better UX, production-ready code.

---

**Questions?** Check the component files for inline documentation and TypeScript types.
