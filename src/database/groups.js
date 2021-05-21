import pool from './pool.js';
import * as commons from 'terraria-launcher.commons';

export const BASIC_GROUP_IDS = Object.freeze({
    registered: 2,
    administrator: 3,
    owner: 6
});

/**
 * 
 * @typedef {object} GroupEntity
 * @property {number} id
 * @property {string} name
 * @property {string} parentId
 */

/**
 * 
 * @typedef {object} LinkedPermission
 * @property {number} id
 * @property {string} name
 * @property {boolean} allow
 * 
 */

/**
 * 
 * @returns {Promise<GroupEntity[]>} groups
 */
export async function getAllGroups() {
    try {
        const [groups] = await pool.execute('SELECT * FROM groups');
        return groups;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}

/**
 * 
 * @returns {Promise<GroupEntity>} group
 */
export async function getGroupByName(name) {
    try {
        const [groups] = await pool.execute('SELECT * FROM groups WHERE name = ?', [name]);
        return groups[0] ?? null;
    } catch {
        throw commons.database.utils.createDatabaseError(error);
    }    
}

/**
 * 
 * @returns {Promise<GroupEntity>} group
 */
export async function getGroupById(id) {
    try {
        const [groups] = await pool.execute('SELECT * FROM `groups` WHERE id = ?', [id]);
        return groups[0] ?? null;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}

/**
 * 
 * @param {number} id 
 * @returns {Array<GroupEntity>} first index is itself.
 */
export async function getGroupByIdWithParents(id) {
    try {
        const [groups] = await pool.execute(
            'WITH RECURSIVE cte(id, `name`, parentId) AS ( ' +
            '    ' + 'SELECT id, `name`, parentId FROM `groups` WHERE id = ? ' +
            '    ' + 'UNION ALL ' +
            '    ' + 'SELECT `groups`.id, `groups`.`name`, `groups`.parentId FROM `groups` ' +
            '    ' + '    ' + 'INNER JOIN cte ON `groups`.id = cte.parentId	AND `groups`.id <> cte.id ' +
            ') ' +
            'SELECT * FROM cte;', [id]);
        return groups;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}

/**
 * 
 * @param {number} groupId
 * @returns {Array<LinkedPermission>}
 */
export async function getPermissionsByGroupId(groupId) {
    try {
        const [permissions] = await pool.execute(
            'WITH RECURSIVE cte(id, `name`, parentId) AS ( ' +
            '    ' + 'SELECT id, `name`, parentId FROM `groups` WHERE id = ? ' +
            '    ' + 'UNION ALL ' +
            '    ' + 'SELECT `groups`.id, `groups`.`name`, `groups`.parentId FROM `groups` ' +
            '    ' + '    ' + 'INNER JOIN cte ON `groups`.id = cte.parentId	AND `groups`.id <> cte.id ' +
            ') ' +
            'SELECT permissions.id, permissions.name, groupPermissionLinks.allow FROM cte ' +
            '    ' + 'INNER JOIN groupPermissionLinks ON cte.id = groupPermissionLinks.groupId ' +
            '    ' + 'INNER JOIN permissions ON groupPermissionLinks.permissionId = permissions.id; '
            , [groupId]);
        return permissions;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}

/**
 * 
 * @typedef {object} ACL
 * @property {string} resource
 * @property {string} query
 * @property {string} action
 * @property {string} scope
 * @property {boolean} allow
 * 
 */

/**
 * 
 * @param {number} groupId 
 * @returns {Array<ACL>} ACLs
 */
export async function getACLsByGroupId(groupId) {
    try {
        const [acls] = await pool.execute(
            'WITH RECURSIVE cte(id, `name`, parentId) AS ( ' +
            '    ' + 'SELECT id, `name`, parentId FROM `groups` WHERE id = ? ' +
            '    ' + 'UNION ALL ' +
            '    ' + 'SELECT `groups`.id, `groups`.`name`, `groups`.parentId FROM `groups` ' +
            '    ' + '    ' + 'INNER JOIN cte ON `groups`.id = cte.parentId	AND `groups`.id <> cte.id ' +
            ') ' +
            'SELECT acls.resource, acls.query, acls.action, acls.scope FROM cte ' +
            '    ' + 'INNER JOIN acls ON cte.id = acls.groupId ' +
            ';'
            , [groupId]);
        return acls;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}
