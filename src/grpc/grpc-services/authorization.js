import * as groupService from '../../services/group-service.js';
import authorizationPbMessages from '../generated-code/services/authentication/authorization_pb.cjs';

export function doesGroupContainsPermission(call, callback) {
    const contains = groupService.doesGroupHasPermission(call.request.getGroup(), call.request.getPermission());
    const response = new authorizationPbMessages.DoesGroupContainsPermissionResponse();
    response.setContains(contains);
    callback(null, response);
}
