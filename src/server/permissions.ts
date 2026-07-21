import { Role } from "@prisma/client";

type PermissionAction = "create" | "read" | "update" | "delete" | "manage";
type PermissionResource = "users" | "customers" | "workorders" | "inventory" | "payments" | "khata" | "invoices" | "reports" | "settings";

type PermissionsMap = Record<Role, Record<PermissionResource, PermissionAction[]>>;

export const PERMISSIONS: PermissionsMap = {
  OWNER: {
    users: ["manage"],
    customers: ["manage"],
    workorders: ["manage"],
    inventory: ["manage"],
    payments: ["manage"],
    khata: ["manage"],
    invoices: ["manage"],
    reports: ["manage"],
    settings: ["manage"],
  },
  ADMIN: {
    users: ["read", "create", "update"],
    customers: ["manage"],
    workorders: ["manage"],
    inventory: ["manage"],
    payments: ["manage"],
    khata: ["manage"],
    invoices: ["manage"],
    reports: ["read"],
    settings: ["read"],
  },
  MANAGER: {
    users: ["read"],
    customers: ["read", "create", "update"],
    workorders: ["manage"],
    inventory: ["manage"],
    payments: ["read", "create"],
    khata: ["read", "create"],
    invoices: ["read", "create", "update"],
    reports: ["read"],
    settings: [],
  },
  STAFF: {
    users: [],
    customers: ["read"],
    workorders: ["read", "update"],
    inventory: ["read", "update"],
    payments: ["read"],
    khata: ["read"],
    invoices: ["read"],
    reports: [],
    settings: [],
  },
};

export const hasPermission = (
  role: Role,
  resource: PermissionResource,
  action: PermissionAction
): boolean => {
  const resourcePermissions = PERMISSIONS[role][resource];
  return resourcePermissions.includes("manage") || resourcePermissions.includes(action);
};

export const getPermissionsArray = (role: Role): string[] => {
  const perms: string[] = [];
  for (const [resource, actions] of Object.entries(PERMISSIONS[role])) {
    for (const action of actions) {
      perms.push(`${resource}:${action}`);
    }
  }
  return perms;
};
