"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/app/actions/audit";

export async function signOut() {
  const supabase = await createClient();
  await logAuditEvent("logout");
  await supabase.auth.signOut();
  redirect("/login");
}
