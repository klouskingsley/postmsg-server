import EventEmitter from 'eventemitter3'
import {serverMsgTypeKey, ServerMessageHttpRequest, ServerMsgType, ErrorType, ServerMessageHttpResponse, ServerMessage, isServerMessage} from './const'
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
      res.error = err.message
    }

    // 返回处理结果
    const msg: ServerMessageHttpResponse = {
      ...res,
      [serverMsgTypeKey]: ServerMsgType.http_response,
      requestId
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
  const messagePingHandler = (data: ServerMessage, origin: string, source: Window) => {
    if (data[serverMsgTypeKey] === ServerMsgType.http_ping) {
      saveClient(source)
      const msg: ServerMessage = {[serverMsgTypeKey]: ServerMsgType.http_pong}
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
  const originOnbeforeunload = window.onbeforeunload
  window.onbeforeunload = function (event) {
    emitCloseMsg()
    if (typeof originOnbeforeunload === 'function') {
      originOnbeforeunload.call(window, event)
    }
  };

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
    state.event.emit(data[serverMsgTypeKey], data)
  })

  const ping = function () {
    return new Promise((resolve) => {
      const msg: ServerMessage = {[serverMsgTypeKey]: ServerMsgType.http_ping}
      state.serverWindow.postMessage(msg, '*')
      state.event.on(ServerMsgType.http_pong, resolve)
    })
  }
  const pingUntilPong = async function() {
    let receivedPong = false
    for (;;) {
      ping().then(() => {
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
    const timeout = typeof option.timeout === 'number' ? option.timeout : 3000
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
      pingUntilPong().then(() => {
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
