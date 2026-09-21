"use server";

import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth/guards";

export async function setContextAction(key: "campusId" | "schoolYearId", value: string) {
  await requireSession();
  const store = await cookies();
  if (!value) store.delete(`sm_${key}`);
  else store.set(`sm_${key}`, value, { path: "/", sameSite: "lax" });
}
