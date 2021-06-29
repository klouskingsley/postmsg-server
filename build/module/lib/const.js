export const serverMsgTypeKey = '__postmsg_server_msg_type__';
export var ServerMsgType;
(function (ServerMsgType) {
    ServerMsgType["http_request"] = "__postmsg_server_msg_type_http_request__";
    ServerMsgType["http_response"] = "__postmsg_server_msg_type_http_response__";
    ServerMsgType["http_ping"] = "__postmsg_server_msg_type_http_ping__";
    ServerMsgType["http_pong"] = "__postmsg_server_msg_type_http_pong__";
    ServerMsgType["http_server_close"] = "__postmsg_server_msg_type_http_server_close__";
    ServerMsgType["websocket_message"] = "__postmsg_server_msg_type_websocket_msg__";
})(ServerMsgType || (ServerMsgType = {}));
export var ErrorType;
(function (ErrorType) {
    ErrorType["no_such_method"] = "no_such_method";
    ErrorType["timeout"] = "timeout";
})(ErrorType || (ErrorType = {}));
export function isServerMessage(data) {
    if (!data) {
        return false;
    }
    if (typeof data !== 'object') {
        return false;
    }
    if (typeof data[serverMsgTypeKey] !== 'string') {
        return false;
    }
    if (!data[serverMsgTypeKey]) {
        return false;
    }
    return true;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbnN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLDZCQUE2QixDQUFBO0FBRTdELE1BQU0sQ0FBTixJQUFZLGFBT1g7QUFQRCxXQUFZLGFBQWE7SUFDdkIsMEVBQXlELENBQUE7SUFDekQsNEVBQTJELENBQUE7SUFDM0Qsb0VBQW1ELENBQUE7SUFDbkQsb0VBQW1ELENBQUE7SUFDbkQsb0ZBQW1FLENBQUE7SUFDbkUsZ0ZBQStELENBQUE7QUFDakUsQ0FBQyxFQVBXLGFBQWEsS0FBYixhQUFhLFFBT3hCO0FBRUQsTUFBTSxDQUFOLElBQVksU0FHWDtBQUhELFdBQVksU0FBUztJQUNuQiw4Q0FBaUMsQ0FBQTtJQUNqQyxnQ0FBbUIsQ0FBQTtBQUNyQixDQUFDLEVBSFcsU0FBUyxLQUFULFNBQVMsUUFHcEI7QUFNRCxNQUFNLFVBQVUsZUFBZSxDQUFFLElBQVM7SUFDeEMsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU8sS0FBSyxDQUFBO0tBQ2I7SUFDRCxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUM1QixPQUFPLEtBQUssQ0FBQTtLQUNiO0lBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLFFBQVEsRUFBRTtRQUM5QyxPQUFPLEtBQUssQ0FBQTtLQUNiO0lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO1FBQzNCLE9BQU8sS0FBSyxDQUFBO0tBQ2I7SUFDRCxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMifQ==