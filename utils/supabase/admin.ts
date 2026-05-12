import { redirect } from "next/navigation"
import { createClient } from "./server"

export async function getAdminContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null, isAdmin: false }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, account_status")
    .eq("id", user.id)
    .single()

  return {
    supabase,
    user,
    profile,
    isAdmin: profile?.role === "admin" && profile?.account_status !== "suspended",
  }
}

export async function requireAdminPage() {
  const context = await getAdminContext()

  if (!context.user) {
    redirect("/login")
  }

  if (!context.isAdmin) {
    redirect("/client")
  }

  return context
}

export async function requireAdminAction() {
  const context = await getAdminContext()

  if (!context.user) {
    return { ...context, error: "Nem vagy bejelentkezve." }
  }

  if (!context.isAdmin) {
    return { ...context, error: "Nincs admin jogosultsagod." }
  }

  return { ...context, error: null }
}

