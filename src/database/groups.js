import pool from './pool.js';

export const BASIC_GROUP_IDS = Object.freeze({
    registered: 1,
    administrator: 2
});

/**
 * 
 * @typedef {object} Group
 * @property {int} id
 * @property {string} name
 * @property {string} parentId
 */

/**
 * 
 * @returns {Promise<Group[]>} groups
 */
export async function getAllGroups() {
    const [rows, fields] = await pool.execute('SELECT * FROM groups');
    return rows;
}

/**
 * 
 * @returns {Promise<Group>} group
 */
export async function getGroupByName(name) {
    const [groups] = await pool.execute('SELECT * FROM groups WHERE name = ?', [name]);
    return groups[0] ?? null;
}

/**
 * 
 * @returns {Promise<Group>} group
 */
export async function getGroupById(id) {
    const [groups] = await pool.execute('SELECT * FROM groups WHERE id = ?', [id]);
    return groups[0] ?? null;
}
