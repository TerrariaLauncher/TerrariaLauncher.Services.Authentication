import pool from './pool.js';
import * as commons from 'terraria-launcher.commons';

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
    try {
        const [users] = await pool.query('SELECT * FROM `users` WHERE ?? = ?', [uniqueField, value]);
        if (Array.isArray(users) && users.length > 0) {
            return users[0];
        }
        return null;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
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

export function getUserByRefreshToken(refreshToken) {
    return getUser('refreshToken', refreshToken);
}

/**
 * 
 * @param {number} id 
 * @param {object} values
 * @param {string | undefined} values.refreshToken
 * @param {string | undefined} values.email
 */
export async function updateUserById(id, values) {
    try {
        const [result] = await pool.query('UPDATE users SET ? WHERE id = ?',
            [values, id]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}

/**
 * 
 * @param {UserEntity} payload
 * @returns {Promise<UserEntity>}
 */
export async function createUser(payload) {
    try {
        const [result] = await pool.query('INSERT INTO users SET ?', [payload]);
        return await getUserById(result.insertId);
    } catch (error) {
        throw commons.database.utils.createDatabaseError(error);
    }
}
