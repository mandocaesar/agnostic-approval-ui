import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardLayoutClient from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session;
  
  try {
    session = await auth();
  } catch (error) {
    // Handle invalid/expired JWT tokens
    console.error("Auth error:", error);
    session = null;
  }
  
  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardLayoutClient user={session.user}>{children}</DashboardLayoutClient>;
}
