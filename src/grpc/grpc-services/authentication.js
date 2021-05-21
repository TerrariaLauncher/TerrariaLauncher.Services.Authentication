import gRpc from '@grpc/grpc-js';
import * as userService from '../../services/user-service.js';
import * as commons from 'terraria-launcher.commons';
import authenticationPbMessages from '../generated-code/services/authentication/authentication_pb.cjs';

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function register(call, callback) {
    try {
        const user = await userService.createUser(call.request);
        const response = new authenticationPbMessages.RegisterResponse();
        response.setId(user.id);
        response.setName(user.name);
        response.setGroup(user.group);
        response.setEmail(user.email);
        callback(null, response);
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
    switch (call.request.getNameOrEmailCase()) {
        case authenticationPbMessages.LoginRequest.NameOrEmailCase.EMAIL:
            if (!userService.isEmail(call.request.getEmail())) {
                return callback({
                    code: gRpc.status.INVALID_ARGUMENT,
                    details: 'Email is not valid.'
                }, null);
            }
            break;
        case authenticationPbMessages.LoginRequest.NameOrEmailCase.NAME_OR_EMAIL_NOT_SET:
            return callback({
                code: gRpc.status.INVALID_ARGUMENT,
                details: 'Name or email is not provided.'
            }, null);
    }

    try {
        const loginResult = await userService.login({
            name: call.request.getName(),
            email: call.request.getEmail(),
            password: call.request.getPassword()
        });

        if (!loginResult) {
            return callback({
                code: gRpc.status.NOT_FOUND,
                details: 'User is not found.'
            });
        }

        const loginResponse = new authenticationPbMessages.LoginResponse();
        loginResponse.setId(loginResult.id);
        loginResponse.setName(loginResult.name);
        loginResponse.setGroup(loginResult.group);
        loginResponse.setRefreshToken(loginResult.refreshToken);
        loginResponse.setAccessToken(loginResult.accessToken);
        callback(null, loginResponse);
    } catch (error) {
        if (error instanceof userService.PasswordMismatchException) {
            return callback({
                code: gRpc.status.INVALID_ARGUMENT,
                details: 'Password mismatch.'
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
            refreshToken: call.request.getRefreshToken()
        });

        const response = new authenticationPbMessages.RenewAccessTokenResponse();
        response.setAccessToken(accessToken);
        callback(null, response);
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
        const decoded = await userService.verifyAccessToken(call.request.getAccessToken());
        const response = new authenticationPbMessages.ParseAccessTokenResponse();
        response.setId(decoded.id);
        response.setName(decoded.name);
        response.setGroup(decoded.group);
        callback(null, response);
    } catch (error) {
        return callback({
            code: gRpc.status.INVALID_ARGUMENT,
            details: 'Invalid access token.'
        });
    }
}

/**
 * 
 * @param {import('@grpc/grpc-js').ServerUnaryCall<any, any>} call 
 * @param {*} callback 
 */
export async function changePassword(call, callback) {
    await userService.changePassword({
        id: call.request.getId(),
        currentPassword: call.request.getCurrentPassword(),
        newPassword: call.request.getNewPassword()
    });
    callback(null, null);
}

export function updateUser(call, callback) {
    callback(null, null);
}

export async function getUser(call, callback) {
    let user = null;
    switch (call.request.getIdentityCase()) {
        case authenticationPbMessages.GetUserRequest.IdentityCase.NAME:
            user = await userService.getUserByName(call.request.name);
            break;
        case authenticationPbMessages.GetUserRequest.IdentityCase.EMAIL:
            user = await userService.getUserByEmail(call.request.email);
            break;
        case authenticationPbMessages.GetUserRequest.IdentityCase.IDENTITY_NOT_SET:
        default:
            return callback({
                code: gRpc.status.INVALID_ARGUMENT,
                details: `Please provide user name or email.`
            });
    }

    if (!user) {
        callback({
            code: gRpc.status.NOT_FOUND,
            details: `Could not find any user with provided identity.`
        });
    }

    const response = new authenticationPbMessages.GetUserResponse();
    response.setId(user.id);
    response.setName(user.name);
    response.setGroup(user.group);
    response.setEmail(user.email);
    callback(null, response);
}
