import * as database from '../database/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import configs from '../configs/index.js';
import { randomBytes } from 'crypto';
import * as commons from 'terraria-launcher.commons';

const ACCESS_TOKEN_SECRET = configs.get('accessTokenSecret');

export class PasswordMismatchException extends Error {
    constructor(message) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PasswordMismatchException);
        }
    }
}

export class InvalidRefreshTokenException extends Error {
    constructor(message) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PasswordMismatchException);
        }
    }
}

const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.compile();
export function isEmail(email) {
    return emailRegex.test(email);
}

/**
 * 
 * @param {object} payload
 * @param {number} payload.id
 * @param {string} payload.name
 * @param {string} payload.group
 * @returns {Promise<string>}
 */
function generateAccessToken(payload) {
    return new Promise((resove, reject) => {
        jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: '5m'
        }, (err, encoded) => {
            if (err) {
                reject(err);
            } else {
                resove(encoded);
            }
        });
    });
}

/**
 * 
 * @returns {Promise<string>} refresh token
 */
function generateRefreshToken() {
    return new Promise((resolve, reject) => {
        randomBytes(64, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(buffer.toString('hex'));
            }
        });
    });
}

/**
 * @typedef {import('../database/index.js').users.UserEntity & {
 * group: string
 * }} UserModel
 */

/**
 * 
 * @param {import('../database/index.js').users.UserEntity} user 
 * @returns {UserModel}
 */
async function getGroupForUser(user) {
    const group = await database.groups.getGroupById(user.groupId);
    user['group'] = group.name;
    return user;
}

async function getUserById(id) {
    const user = await database.users.getUserById(id);
    return user && await getGroupForUser(user);
}

export async function getUserByName(name) {
    const user = await database.users.getUserByName(name);
    return user && await getGroupForUser(user);
}

export async function getUserByEmail(email) {
    const user = await database.users.getUserByEmail(email);
    return user && await getGroupForUser(user);
}

export async function getUserByRefreshToken(refreshToken) {
    const user = await database.users.getUserByRefreshToken(refreshToken);
    return user && await getGroupForUser(user);
}

/**
 * 
 * @param {object} payload
 * @param {string} payload.name
 * @param {string} payload.password
 * @param {string} payload.email
 */
export async function createUser(payload) {
    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const userEntity = await database.users.createUser({
        name: payload.name,
        password: hashedPassword,
        groupId: database.groups.BASIC_GROUP_IDS.registered,
        email: payload.email
    });
    return await getGroupForUser(userEntity);
}

/**
 * 
 * @param {object} payload
 * @param {string?} payload.name
 * @param {string?} payload.email
 * @param {string} payload.password
 */
export async function login(payload) {
    let user = null;
    if (payload.name) {
        user = await getUserByName(payload.name);
    } else if (payload.email) {
        user = await getUserByEmail(payload.email);
    } else {
        return null;
    }
    
    if (user == null) {
        return null;
    }

    const isPasswordTheSame = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordTheSame) {
        throw new PasswordMismatchException();
    }

    if (!user.refreshToken) {
        const refreshToken = await generateRefreshToken();
        await database.users.updateUserById(user.id, {
            refreshToken,
            lastRefreshTokenIssued: new Date()
        });
        user.refreshToken = refreshToken;
    }

    const accessToken = await generateAccessToken({
        id: user.id,
        name: user.name,
        group: user.group
    });

    await database.users.updateUserById(user.id, {
        lastAccessTokenIssued: new Date(),
        lastLogin: new Date()
    });

    return {
        id: user.id,
        name: user.name,
        group: user.group,
        refreshToken: user.refreshToken,
        accessToken
    };
}

/**
 * 
 * @param {object} payload
 * @param {number} payload.id
 * @param {string} payload.currentPassword
 * @param {string} payload.newPassword
 */
export async function changePassword(payload) {
    const user = await getUserById(payload.id);
    const isCurrentPasswordValid = await bcrypt.compare(user.password, payload.currentPassword);
    if (!isCurrentPasswordValid) {
        throw new PasswordMismatchException();
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, 12);
    const refreshToken = await generateRefreshToken();
    await database.users.updateUserById(id, {
        password: hashedPassword,
        lastPasswordChanged: new Date(),
        refreshToken,
        lastRefreshTokenIssued: new Date()
    });
}

/**
 * 
 * @param {object} payload
 * @param {object} payload.refreshToken
 */
export async function issueAccessToken(payload) {
    const user = await getUserByRefreshToken(payload.refreshToken);
    if (!user) throw new InvalidRefreshTokenException();

    const accessToken = await generateAccessToken({
        id: user.id,
        name: user.name,
        group: user.group
    });

    await database.users.updateUserById(user.id, {
        lastAccessTokenIssued: new Date()
    });

    return accessToken;
}

/**
 * 
 * @param {object} payload
 * @param {string} payload.accessToken
 */
export async function verifyAccessToken(accessToken) {
    const decoded = await jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    const { id, name, group } = decoded;
    return {
        id,
        name,
        group
    };
}
