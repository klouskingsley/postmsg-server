export const serverMsgTypeKey = '__postmsg_server_msg_type__'

export enum ServerMsgType {
  http_request = '__postmsg_server_msg_type_http_request__',
  http_response = '__postmsg_server_msg_type_http_response__',
  http_ping = '__postmsg_server_msg_type_http_ping__',
  http_server_close = '__postmsg_server_msg_type_http_server_close__',
  websocket_message = '__postmsg_server_msg_type_websocket_msg__'
}

export enum ErrorType {
  no_such_method = 'no_such_method',
  timeout = 'timeout',
}

export interface ServerMessage {
  [serverMsgTypeKey]: ServerMsgType
}

export function isServerMessage (data: any) {
  if (!data) {
    return false
  }
  if (typeof data !== 'object') {
    return false
  }
  if (typeof data[serverMsgTypeKey] !== 'string') {
    return false
  }
  if (!data[serverMsgTypeKey]) {
    return false
  }
  return true
}

export function getHttpRequestEventKey (msg: ServerMessageHttpBase) {
  return `${msg[serverMsgTypeKey]}-${msg.requestId}`
}

export interface ServerMessageHttpBase extends ServerMessage {
  requestId: string
  serverName: string
}

export type ServerMessagePing = ServerMessageHttpBase

export interface ServerMessageHttpRequest extends ServerMessageHttpBase {
  method: string
  param: any
}

export interface ServerMessageHttpResponse extends ServerMessageHttpBase {
  response: any
  error: string
}

export interface ServerMessageWebsocketMessage extends ServerMessage {
  message: any
}
