"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHttpRequestEventKey = exports.isServerMessage = exports.ErrorType = exports.ServerMsgType = exports.serverMsgTypeKey = void 0;
exports.serverMsgTypeKey = '__postmsg_server_msg_type__';
var ServerMsgType;
(function (ServerMsgType) {
    ServerMsgType["http_request"] = "__postmsg_server_msg_type_http_request__";
    ServerMsgType["http_response"] = "__postmsg_server_msg_type_http_response__";
    ServerMsgType["http_ping"] = "__postmsg_server_msg_type_http_ping__";
    ServerMsgType["http_server_close"] = "__postmsg_server_msg_type_http_server_close__";
    ServerMsgType["websocket_message"] = "__postmsg_server_msg_type_websocket_msg__";
})(ServerMsgType = exports.ServerMsgType || (exports.ServerMsgType = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["no_such_method"] = "no_such_method";
    ErrorType["timeout"] = "timeout";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
function isServerMessage(data) {
    if (!data) {
        return false;
    }
    if (typeof data !== 'object') {
        return false;
    }
    if (typeof data[exports.serverMsgTypeKey] !== 'string') {
        return false;
    }
    if (!data[exports.serverMsgTypeKey]) {
        return false;
    }
    return true;
}
exports.isServerMessage = isServerMessage;
function getHttpRequestEventKey(msg) {
    return `${msg[exports.serverMsgTypeKey]}-${msg.requestId}`;
}
exports.getHttpRequestEventKey = getHttpRequestEventKey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFhLFFBQUEsZ0JBQWdCLEdBQUcsNkJBQTZCLENBQUE7QUFFN0QsSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDBFQUF5RCxDQUFBO0lBQ3pELDRFQUEyRCxDQUFBO0lBQzNELG9FQUFtRCxDQUFBO0lBQ25ELG9GQUFtRSxDQUFBO0lBQ25FLGdGQUErRCxDQUFBO0FBQ2pFLENBQUMsRUFOVyxhQUFhLEdBQWIscUJBQWEsS0FBYixxQkFBYSxRQU14QjtBQUVELElBQVksU0FHWDtBQUhELFdBQVksU0FBUztJQUNuQiw4Q0FBaUMsQ0FBQTtJQUNqQyxnQ0FBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFcsU0FBUyxHQUFULGlCQUFTLEtBQVQsaUJBQVMsUUFHcEI7QUFNRCxTQUFnQixlQUFlLENBQUUsSUFBUztJQUN4QyxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUE7S0FDYjtJQUNELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQzVCLE9BQU8sS0FBSyxDQUFBO0tBQ2I7SUFDRCxJQUFJLE9BQU8sSUFBSSxDQUFDLHdCQUFnQixDQUFDLEtBQUssUUFBUSxFQUFFO1FBQzlDLE9BQU8sS0FBSyxDQUFBO0tBQ2I7SUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFnQixDQUFDLEVBQUU7UUFDM0IsT0FBTyxLQUFLLENBQUE7S0FDYjtJQUNELE9BQU8sSUFBSSxDQUFBO0FBQ2IsQ0FBQztBQWRELDBDQWNDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUUsR0FBMEI7SUFDaEUsT0FBTyxHQUFHLEdBQUcsQ0FBQyx3QkFBZ0IsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtBQUNwRCxDQUFDO0FBRkQsd0RBRUMifQ==