import gRpc from '@grpc/grpc-js';
import * as userService from '../../services/user-service.js';
import * as commons from 'terraria-launcher.commons';

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function register(call, callback) {
    try {
        const user = await userService.createUser(call.request);
        callback(null, {
            id: user.id,
            name: user.name,
            group: user.group,
            email: user.email
        });
    } catch (error) {
        if (error instanceof commons.database.exceptions.DuplicateEntry) {
            return callback({
                code: gRpc.status.ALREADY_EXISTS,
                details: error.message
            });
        } else {
            console.log(error);
            return callback({
                code: gRpc.status.UNKNOWN,
                details: error.message
            });
        }
    }
}

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function login(call, callback) {
    const identity = call.request.name ?? call.request.email;
    if (!identity) {
        return callback({
            status: gRpc.status.INVALID_ARGUMENT,
            message: 'Name or email is not provided.'
        }, null);
    }

    try {
        const loginResponse = await userService.login({
            identity: identity,
            password: call.request.password
        });
        callback(null, loginResponse);
    } catch (error) {
        if (error instanceof userService.PasswordMismatchException) {
            return callback({
                status: gRpc.status.INVALID_ARGUMENT,
                message: 'Password mismatch.'
            }, null);
        } else {
            throw error;
        }
    }
}

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function renewAccessToken(call, callback) {
    try {
        const accessToken = await userService.issueAccessToken({
            refreshToken: call.request.refreshToken
        });

        callback(null, {
            accessToken
        });
    } catch (error) {
        if (error instanceof userService.InvalidRefreshTokenException) {
            return callback({
                code: gRpc.status.INVALID_ARGUMENT,
                details: 'Provided refresh token is not valid.'
            }, null);
        } else {
            throw error;
        }
    }
}

export async function verifyAccessToken(call, callback) {
    try {
        const decoded = await userService.verifyAccessToken(call.request.accessToken);
        callback(null, {
            id: decoded.id,
            name: decoded.name,
            group: decoded.group
        });
    } catch (error) {
        return callback({
            code: gRpc.status.INVALID_ARGUMENT,
            details: 'Invalid access token.'
        }, null);
    }
}

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function changePassword(call, callback) {
    await userService.changePassword(call.request);
    callback(null, null);
}

export function updateUser(call, callback) {
    callback(null, null);
}

export async function getUserByName(call, callback) {
    const user = await userService.getUserByName(call.request.name);
    if (user) {
        callback(null, user);
    } else {
        callback({
            code: gRpc.status.NOT_FOUND,
            details: `Could not find any user with name is '${call.request.name}'.`
        }, null);
    }
}

export async function getUserByEmail(call, callback) {
    const user = await userService.getUserByEmail(call.request.email);
    if (user) {
        callback(null, user);
    } else {
        callback({
            code: gRpc.status.NOT_FOUND,
            details: `Could not find nay user with email is '${call.request.email}'`
        });
    }
}
