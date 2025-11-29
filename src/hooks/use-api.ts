/**
 * Custom React Hook for API Calls
 * Provides automatic error handling, loading states, and type safety
 */

import { useState, useCallback } from "react";
import { toast } from "@/components/ui/toast";

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Hook for making API calls with automatic error handling and loading states
 *
 * @example
 * const { execute, loading, error } = useApi<Approval>(async () => {
 *   const res = await fetch('/api/approvals', { method: 'POST', body: JSON.stringify(data) });
 *   return res.json();
 * }, {
 *   successMessage: "Approval created!",
 *   onSuccess: (approval) => router.push(`/approvals/${approval.id}`)
 * });
 */
export function useApi<T>(
  apiFunction: () => Promise<Response | ApiResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const response = await apiFunction();

      // Handle Response object
      if (response instanceof Response) {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check for API response format
        if ('success' in data) {
          if (!data.success) {
            throw new Error(data.error?.message || "API request failed");
          }

          setState({ data: data.data, loading: false, error: null });

          if (showSuccessToast && successMessage) {
            toast.success(successMessage);
          }

          if (onSuccess) {
            onSuccess(data.data);
          }

          return data.data;
        }

        // Legacy format (no success field)
        setState({ data, loading: false, error: null });

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      }

      // Handle ApiResponse object directly
      if ('success' in response) {
        if (!response.success) {
          throw new Error(response.error?.message || "API request failed");
        }

        setState({ data: response.data || null, loading: false, error: null });

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess && response.data) {
          onSuccess(response.data);
        }

        return response.data;
      }

      // Fallback
      setState({ data: response as unknown as T, loading: false, error: null });
      return response as unknown as T;

    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");

      setState({ data: null, loading: false, error });

      if (showErrorToast) {
        toast.error(errorMessage || error.message);
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [apiFunction, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !!state.data && !state.error,
  };
}

/**
 * Hook for fetching data on mount
 *
 * @example
 * const { data, loading, error, refetch } = useFetch<Approval[]>('/api/approvals');
 */
export function useFetch<T>(
  url: string | (() => string),
  options: RequestInit & UseApiOptions<T> = {}
) {
  const [trigger, setTrigger] = useState(0);

  const urlString = typeof url === 'function' ? url() : url;

  const apiCall = useCallback(async () => {
    return fetch(urlString, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }, [urlString, trigger, options]);

  const api = useApi<T>(apiCall, {
    ...options,
    showSuccessToast: false, // Don't show toast on fetch
  });

  // Auto-fetch on mount and when trigger changes
  const refetch = useCallback(() => {
    setTrigger((t) => t + 1);
    return api.execute();
  }, [api]);

  // Initial fetch
  if (!api.loading && !api.data && !api.error && trigger === 0) {
    refetch();
  }

  return {
    ...api,
    refetch,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 *
 * @example
 * const { mutate, loading } = useMutation<Approval>(
 *   (data) => fetch('/api/approvals', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   }),
 *   { successMessage: "Created!" }
 * );
 */
export function useMutation<TData, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<Response>,
  options: UseApiOptions<TData> = {}
) {
  const [variables, setVariables] = useState<TVariables | null>(null);

  const apiCall = useCallback(async () => {
    if (!variables) throw new Error("No variables provided");
    return mutationFn(variables);
  }, [mutationFn, variables]);

  const api = useApi<TData>(apiCall, options);

  const mutate = useCallback(async (vars: TVariables) => {
    setVariables(vars);
    return api.execute();
  }, [api]);

  return {
    ...api,
    mutate,
  };
}
