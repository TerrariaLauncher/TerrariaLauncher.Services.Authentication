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
 * @property {string} baseId
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
export async function getGroupByIdWithBaseGroups(id) {
    try {
        const [groups] = await pool.execute(
            'WITH RECURSIVE cte(id, `name`, baseId) AS ( ' +
            '    ' + 'SELECT id, `name`, baseId FROM `groups` WHERE id = ? ' +
            '    ' + 'UNION ALL ' +
            '    ' + 'SELECT `groups`.id, `groups`.`name`, `groups`.baseId FROM `groups` ' +
            '    ' + '    ' + 'INNER JOIN cte ON `groups`.id = cte.baseId	AND `groups`.id <> cte.id ' +
            ') ' +
            'SELECT * FROM cte;', [id]);
        return groups;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}
