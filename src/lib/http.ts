// import EventEmitter, {EventEmitter, EventEmitterStatic} from 'eventemitter3'
import { EventEmitter} from 'events';
import {serverMsgTypeKey, ServerMessageHttpRequest, ServerMsgType, ErrorType, ServerMessageHttpResponse, ServerMessage, isServerMessage, ServerMessagePing, getHttpRequestEventKey} from './const'
import {uniqueId, sleep} from './util'


type HandlerFn = (...param: any) => Promise<any>

interface ServerState {
  clientList: Window[]
  name: string
  methodHandler: Map<string, HandlerFn>
}

// interface HandleFnParam<T> {
//   param: T
//   origin: string
//   method: string
//   requestId: string
//   source: Window
// }

type HandleFnParam<T, Rt> = (param: T, origin: string, source: Window) => Rt

export function createHttpServer<ServerHandler extends Record<keyof ServerHandler, (...args: any) => any>>({name}: {name: string}) {
  if (!name || typeof name !== 'string') {
    throw new Error(`createHttpServer(option): option.name require a non-empty string`)
  }
  const state: ServerState = {
    clientList: [],
    name,
    methodHandler: new Map<string, HandlerFn>()
  }

  const noMethodHandler: HandlerFn = () => Promise.reject(new Error(ErrorType.no_such_method))
  const emitCloseMsg = () => {
    state.clientList.forEach(win => {
      const msg: ServerMessage = {[serverMsgTypeKey]: ServerMsgType.http_server_close}
      win.postMessage(msg, '*')
    })
  }
  const saveClient = (source: Window) => {
    if (state.clientList.indexOf(source) < 0) {
      state.clientList.push(source)
    }
  }
  const handleRequest = async (requestId: string, method: string, param: any, origin: string, source: Window) => {
    // 保存 source, 供 window.close 时通知
    saveClient(source)

    // 获取 处理 函数
    let fn: HandlerFn = noMethodHandler
    if (state.methodHandler.has(method)) {
      fn = state.methodHandler.get(method)!
    }

    // 得到处理结果
    let res: {response: any, error: any} = {response: '', error: ''}
    try {
      res.response = await fn(param,origin,source)
    } catch (err) {
      console.error(err)
      res.error = err.message
    }

    // 返回处理结果
    const msg: ServerMessageHttpResponse = {
      ...res,
      [serverMsgTypeKey]: ServerMsgType.http_response,
      requestId,
      serverName: state.name,
    }
    source.postMessage(msg, origin)
  }
  const messageRequestHandler = (data: ServerMessageHttpRequest, origin: string, source: Window) => {
    if (data[serverMsgTypeKey] !== ServerMsgType.http_request) {
      return
    }
    const {serverName, method, param, requestId} = data
    if (serverName !== state.name) {
      return
    }
    if (!method) {
      return
    }
    if (source) {
      handleRequest(requestId, method, param, origin, source as Window)
    }
  }
  const messagePingHandler = (data: ServerMessagePing, origin: string, source: Window) => {
    if (data[serverMsgTypeKey] !== ServerMsgType.http_ping) {
      return
    }
    const {serverName, requestId} = data
    if (serverName !== state.name) {
      return
    }

    if (data[serverMsgTypeKey] === ServerMsgType.http_ping) {
      saveClient(source)
      const msg: ServerMessagePing = {[serverMsgTypeKey]: ServerMsgType.http_ping, requestId, serverName}
      source.postMessage(msg, origin)
    }
  }

  window.addEventListener('message', (event) => {
    const {data, origin, source} = event
    if (!isServerMessage(data)) {
      return
    }
    messageRequestHandler(data, origin, source as Window)
    messagePingHandler(data, origin, source as Window)
  })
  window.addEventListener('beforeunload', function() {
    emitCloseMsg()
  })

  const on = function<Method extends keyof ServerHandler> (method: Method, callback: HandleFnParam<Parameters<ServerHandler[Method]>[0], ReturnType<ServerHandler[Method]>>) {
    const has = state.methodHandler.has(method as string)
    if (has) {
      console.warn(`server.on: ${method}'s previous handler will be override`)
    }
    // (param?: any) => Promise<any>
    state.methodHandler.set(method as string, callback as any)
  }

  return {
    on,
  }
}

interface ClientState {
  name: string,
  serverWindow: Window
  event: EventEmitter
}

export function createHttpClient<ServerHandler extends Record<keyof ServerHandler, (...args: any) => any>>({name, serverWindow}: {name: string, serverWindow: any}) {

  if (!name || typeof name !== 'string') {
    throw new Error('createHttpClient(option): option.name require a non-empty string')
  }
  if (!serverWindow) {
    throw new Error('createHttpClient(option): option.serverWindow required')
  }

  const state: ClientState = {
    name,
    serverWindow,
    event: new EventEmitter()
  }

  window.addEventListener('message', (event) => {
    const {data, source} = event
    if (serverWindow !== source) {
      return
    }
    if (!isServerMessage(data)) {
      return
    }
    const eventKey = getHttpRequestEventKey(data)
    state.event.emit(data[serverMsgTypeKey], data)
    state.event.emit(eventKey, data)
  })

  const ping = function (msg: ServerMessagePing) {
    return new Promise((resolve) => {
      state.serverWindow.postMessage(msg, '*')
      const eventKey = getHttpRequestEventKey(msg)
      state.event.removeAllListeners(eventKey)
      state.event.on(eventKey, resolve)
    })
  }

  const pingUntilPong = async function(msg: ServerMessagePing) {
    let receivedPong = false
    for (;;) {
      ping(msg).then(() => {
        receivedPong = true
      })
      if (receivedPong) {
        break;
      }
      await sleep(50);
    }
  }

  const request = function<Method extends keyof ServerHandler> (option: {
    timeout?: number;
    method: Method;
    param?: Parameters<ServerHandler[Method]>[0];
  }): ReturnType<ServerHandler[Method]> {
    const {method} = option
    if (!method || typeof method !== 'string') {
      throw new Error('httpClient.request(method, param): method is required')
    }
    const timeout = typeof option.timeout === 'number' ? option.timeout : 0
    const requestId = uniqueId()
    const msg: ServerMessageHttpRequest = {
      [serverMsgTypeKey]: ServerMsgType.http_request,
      method,
      param: option.param,
      requestId: requestId,
      serverName: state.name,
    }

    // 先进行ping
    return new Promise((resolve, reject) => {
      // 设置超时
      let isFail = false
      if (timeout > 0) {
        setTimeout(() => {
          isFail = true
          reject(new Error(ErrorType.timeout))
        }, timeout)
      }
      // 先进行 ping, todo 可能需要不断的ping(pingUntilPong), ping 通后再进行 request
      const pingMsg = {
        [serverMsgTypeKey]: ServerMsgType.http_ping,
        requestId: requestId,
        serverName: state.name,
      }
      pingUntilPong(pingMsg).then(() => {
        if (isFail) {
          return
        }
        state.serverWindow.postMessage(msg, '*')
        state.event.on(ServerMsgType.http_response, (responseMsg: ServerMessageHttpResponse) => {
          if (responseMsg.requestId === msg.requestId) {
            if (responseMsg.error) {
              reject(new Error(responseMsg.error))
            } else {
              resolve(responseMsg.response)
            }
          }
        })
      })
    }) as any
  }

  return {
    request
  };
}
