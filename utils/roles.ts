export type UserRole = "admin" | "trainer" | "client"
export type AccountStatus = "active" | "suspended" | "pending"

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  trainer: "Edzo",
  client: "Kliens",
}

export const accountStatusLabels: Record<AccountStatus, string> = {
  active: "Aktiv",
  suspended: "Felfuggesztve",
  pending: "Ellenorzes alatt",
}

export function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "trainer" || value === "client"
}

export function isAccountStatus(value: string): value is AccountStatus {
  return value === "active" || value === "suspended" || value === "pending"
}

