import * as database from '../database/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import configs from '../../configs/index.js';

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
async function createUserModel(user) {
    const group = await database.groups.getGroupById(user.groupId);
    user['group'] = group.name;
    return user;
}

async function getUserById(id) {
    const user = await database.users.getUserById(id);
    return await createUserModel(user);
}

async function getUserByName(name) {
    const user = await database.users.getUserByName(name);
    return await createUserModel(user);
}

async function getUserByEmail(email) {
    const user = await database.users.getUserByEmail(email);
    return await createUserModel(user);
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
    return await createUserModel(userEntity);
}

function isEmail(email) {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
}

export class PasswordMismatchException extends Error {
    constructor(message) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PasswordMismatchException);
        }
    }
}

export class RefreshTokenMismatchException extends Error {
    constructor(message) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PasswordMismatchException);
        }
    }
}

const ACCESS_TOKEN_SECRET = configs.get('accessTokenSecret');
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
 * 
 * @param {object} payload
 * @param {string} payload.identity
 * @param {string} payload.password
 */
export async function login(payload) {
    let user = null;
    if (isEmail(payload.identity)) {
        user = await getUserByEmail(payload.identity);
    } else {
        user = await getUserByName(payload.identity);
    }

    const isPasswordTheSame = await bcrypt.compare(payload.password, user.password);
    if (isPasswordTheSame) {
        throw new PasswordMismatchException();
    }

    const refreshToken = await generateRefreshToken();
    await database.users.updateUserById({
        refreshToken,
        lastRefreshTokenIssued: new Date(),
        lastLogin: new Date()
    });
    const accessToken = await generateAccessToken({
        id: user.id,
        name: user.name,
        group: user.group
    });

    return {
        id: user.id,
        name: user.name,
        group: user.group,
        refreshToken,
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
export function changePassword(payload) {
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
 * @param {object} payload.id
 * @param {object} payload.refreshToken
 */
export async function issueAccessToken(payload) {
    const user = await getUserById(id);
    if (payload.refreshToken !== user.refreshToken) {
        throw new RefreshTokenMismatchException();
    }

    const accessToken = await generateAccessToken({
        id: user.id,
        name: user.name,
        group: user.group
    });

    await database.users.updateUserById(id, {
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
