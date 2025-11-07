"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PageHeaderContent {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

const DEFAULT_HEADER: PageHeaderContent = {
  eyebrow: "Approval Operations Center",
  title: "Agnostic Approval Hub",
  description:
    "Monitor approval flow health, orchestrate JSON rules, and align every domain.",
};

interface PageHeaderContextValue {
  header: PageHeaderContent;
  setHeader: (next: PageHeaderContent) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(
  undefined,
);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderContent>(DEFAULT_HEADER);
  const value = useMemo(
    () => ({
      header,
      setHeader,
    }),
    [header],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("PageHeaderContext is missing a provider.");
  }
  return ctx;
}

export function PageHeaderMount(props: Partial<PageHeaderContent>) {
  const { setHeader } = usePageHeaderContext();
  const { eyebrow, title, description, actions } = props;

  useEffect(() => {
    setHeader({
      eyebrow: eyebrow ?? DEFAULT_HEADER.eyebrow,
      title: title ?? DEFAULT_HEADER.title,
      description: description ?? DEFAULT_HEADER.description,
      actions,
    });
    return () => setHeader(DEFAULT_HEADER);
  }, [actions, description, eyebrow, setHeader, title]);

  return null;
}

export function PageHeaderText() {
  const { header } = usePageHeaderContext();

  return (
    <div>
      <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-slate-400">
        {header.eyebrow}
      </p>
      {/* <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {header.title}
      </h1> */}
      <p className="mt-2 text-sm text-slate-500">{header.description}</p>
    </div>
  );
}

export function PageHeaderActions({ className }: { className?: string }) {
  const { header } = usePageHeaderContext();

  if (!header.actions) {
    return null;
  }

  return (
    <div className={className ?? "flex items-center justify-end"}>
      {header.actions}
    </div>
  );
}

export { DEFAULT_HEADER as DEFAULT_PAGE_HEADER };
