import EventEmitter from 'eventemitter3'
import {serverMsgTypeKey, ServerMessageHttpRequest, ServerMsgType, ErrorType, ServerMessageHttpResponse, ServerMessage, isServerMessage} from './const'
import {uniqueId} from './util'


type HandlerFn = (param: any) => Promise<any>

interface ServerState {
  clientList: Window[]
  name: string
  methodHandler: Map<string, HandlerFn>
}

export function createHttpServer({name}: {name: string}) {
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
      res.response = await fn(param)
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

  const on = function (method: string, callback: (param?: any) => Promise<any>) {
    const has = state.methodHandler.has(method)
    if (has) {
      console.warn(`server.on: ${method}'s previous handler will be override`)
    }
    state.methodHandler.set(method, callback)
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

interface RequestOption {
  timeout?: number
  param?: any
}

export function createHttpClient({name, serverWindow}: {name: string, serverWindow: any}) {

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

  const request = function (method: string, option?: RequestOption) {
    if (!method || typeof method !== 'string') {
      throw new Error('httpClient.request(method, param): method is required')
    }
    option = option || {}
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
      // 先进行 ping, ping 通后再进行 request
      ping().then(() => {
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
    })
  }

  return {
    request
  };
}
