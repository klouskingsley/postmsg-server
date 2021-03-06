export declare const serverMsgTypeKey = "__postmsg_server_msg_type__";
export declare enum ServerMsgType {
    http_request = "__postmsg_server_msg_type_http_request__",
    http_response = "__postmsg_server_msg_type_http_response__",
    http_ping = "__postmsg_server_msg_type_http_ping__",
    http_server_close = "__postmsg_server_msg_type_http_server_close__",
    websocket_message = "__postmsg_server_msg_type_websocket_msg__"
}
export declare enum ErrorType {
    no_such_method = "no_such_method",
    timeout = "timeout"
}
export interface ServerMessage {
    [serverMsgTypeKey]: ServerMsgType;
}
export declare function isServerMessage(data: any): boolean;
export declare function getHttpRequestEventKey(msg: ServerMessageHttpBase): string;
export interface ServerMessageHttpBase extends ServerMessage {
    requestId: string;
    serverName: string;
}
export declare type ServerMessagePing = ServerMessageHttpBase;
export interface ServerMessageHttpRequest extends ServerMessageHttpBase {
    method: string;
    param: any;
}
export interface ServerMessageHttpResponse extends ServerMessageHttpBase {
    response: any;
    error: string;
}
export interface ServerMessageWebsocketMessage extends ServerMessage {
    message: any;
}
