import * as groupService from '../../services/group-service.js';

export function doesGroupContainsPermission(call, callback) {
    const contains = groupService.doesGroupHasPermission(call.request.group, call.request.permission);
    callback(null, {
        contains
    });
}
