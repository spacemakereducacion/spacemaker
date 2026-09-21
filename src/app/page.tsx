import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { defaultHome } from "@/lib/rbac/permissions";

export default async function HomePage() {
  const session = await getSession();
  redirect(session ? defaultHome(session.role) : "/login");
}
