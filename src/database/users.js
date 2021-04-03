import pool from './pool.js';

/**
 * @typedef {Object} UserEntity
 * @property {number} id
 * @property {string} name
 * @property {string} password
 * @property {string} email
 * @property {number} groupId
 * @property {string} acessToken
 * @property {string} refreshToken
 * @property {Date} lastLogin
 * @property {Date} lastRefreshTokenIssued
 * @property {Date} lastAccessTokenIssued
 * @property {Date} lastPasswordChanged
 * @property {Date} registeredAt
 */

async function getUser(uniqueField, value) {
    const [users] = await pool.query('SELECT * FROM users WHERE ?? = ?', [uniqueField, value]);
    if (Array.isArray(users) && users.length > 0) {
        return results[0];
    }
    return null;
}

/**
 * 
 * @param {number} id
 * @returns {Promise<UserEntity>}
 */
export function getUserById(id) {
    return getUser('id', id);
}

/**
 * 
 * @param {string} name
 * @returns {Promise<UserEntity>}
 */
export function getUserByName(name) {
    return getUser('name', name);
}

export function getUserByEmail(email) {
    return getUser('email', email);
}

/**
 * 
 * @param {number} id 
 * @param {object} values
 * @param {string | undefined} values.refreshToken
 * @param {string | undefined} values.email
 */
export async function updateUserById(id, values) {
    const [result] = await pool.query('UPDATE users SET ? WHERE id = ?',
        [values, id]
    );

    return result.affectedRows > 0;
}

/**
 * 
 * @param {UserEntity} payload
 * @returns {Promise<UserEntity>}
 */
export async function createUser(payload) {
    const [result] = await pool.query('INSET INTO users SET ?', [payload]);
    return await getUserById(result.insertId);
}
