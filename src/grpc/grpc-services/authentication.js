import gRpc from '@grpc/grpc-js';
import * as userService from '../../services/user-service.js';

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function register(call, callback) {
    const user = await userService.registry(call.request);
    callback(null, {
        id: user.id,
        name: user.name,
        group: user.group,
        email: user.email
    });
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
        });
    }

    let loginResponse = null;
    try {
        loginResponse = await userService.login({
            identity: identity,
            password: call.request.password
        });
    } catch (exception) {
        if (exception instanceof userService.PasswordMismatchException) {
            return callback({
                status: gRpc.status.INVALID_ARGUMENT,
                message: 'Password mismatch.'
            }, null);
        }
    }

    callback(null, loginResponse);
}

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function issueAccessToken(call, callback) {
    let accessToken = '';
    try {
        accessToken = await userService.issueAccessToken({
            id: call.request.id,
            refreshToken: call.request.accessToken
        });
    } catch (exception) {
        if (exception instanceof userService.RefreshTokenMismatchException) {
            return callback({
                status: gRpc.status.INVALID_ARGUMENT,
                message: 'Refresh token is not valid.'
            }, null);
        }

        return callback({
            status: gRpc.status.INTERNAL
        }, null);
    }

    callback(null, {
        accessToken
    });
}

export async function verifyAccessToken(call, callback) {
    let decoded = null;
    try {
        decoded = await userService.verifyAccessToken(call.request.accessToken);
    } catch (exception) {
        return callback({
            status: gRpc.status.INVALID_ARGUMENT,
            message: 'Invalid access token.'
        }, null);
    }

    callback(null, {
        id: decoded.id,
        name: decoded.name,
        group: decoded.group
    });
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

export async function createPasswordRecoveryRequest(call, callback) {
    callback(null, null);
}

export async function isPasswordRecoveryRequestValid(call, callback) {
    callback(null, null);
}

export async function resolvePasswordRecoveryRequest(call, callback) {
    callback(null, null);
}
