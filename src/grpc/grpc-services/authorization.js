import * as groupService from '../../services/group-service.js';
import authorizationPbMessages from '../generated-code/services/authentication/authorization_pb.cjs';

export function isGroupAllowed(call, callback) {
    const isBasedOn = groupService.checkGroupIsBasedOn(call.request.getGroup(), call.request.getRequiredGroup());
    const response = new authorizationPbMessages.IsGroupAllowedResponse();
    response.setIsAllowed(isBasedOn);
    callback(null, response);
}
