import * as database from '../database/index.js';

/**
 * @type {Object<string, Set>}
 */
const PERMISSION_LOOKUP = {};
await reloadPermissions();

export async function reloadPermissions() {
    const groups = await database.groups.getAllGroups();
    for (const group of groups) {
        const permissions = await database.groups.getPermissionsByGroupId(group.id);
        const groupPermissions = new Set();
        for (const permission of permissions) {
            groupPermissions.add(permission.name);
        }
        PERMISSION_LOOKUP[group.id] = PERMISSION_LOOKUP[group.name] = groupPermissions;
    }
}

export function doesGroupHasPermission(group, permission) {
    return PERMISSION_LOOKUP[group]?.has(permission) ?? false;
}

export function getGroupById(id) {
    database.groups.getGroupPermissionsByGroupId()
    return database.groups.getGroupById(id);
}
