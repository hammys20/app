import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/auth/server-context";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
