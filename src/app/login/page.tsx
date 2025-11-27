import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  let session;
  
  try {
    session = await auth();
  } catch (error) {
    // Handle invalid/expired JWT tokens from previous session
    console.error("Auth error:", error);
    session = null;
  }

  if (session?.user) {
    redirect("/dashboard/approvals");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <LoginForm />
    </div>
  );
}
