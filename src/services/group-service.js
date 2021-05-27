import * as database from '../database/index.js';

/**
 * @type {Object<string, Set>}
 */
const BASE_GROUP_LOOKUP = {};
await loadGroupsWithBaseGroups();

export async function loadGroupsWithBaseGroups() {
    const groups = await database.groups.getAllGroups();
    for (const group of groups) {
        const groupWithBaseGroups = await database.groups.getGroupByIdWithBaseGroups(group.id);
        const baseSet = new Set();
        groupWithBaseGroups.forEach(group => baseSet.add(group.name));
        BASE_GROUP_LOOKUP[group.name] = baseSet;
    }
}

export function checkGroupIsBasedOn(group, baseGroup) {
    if (baseGroup === '*') return true;
    return BASE_GROUP_LOOKUP[group]?.has(baseGroup) ?? false;
}

export function getGroupById(id) {
    return database.groups.getGroupById(id);
}
