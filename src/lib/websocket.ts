
// import * as EventEmitter from 'eventemitter3'
import {EventEmitter} from 'events'
import { ServerMessageWebsocketMessage, ServerMsgType, serverMsgTypeKey, isServerMessage } from './const'

interface WebsocketState {
  remoteWindow: Window
  event: EventEmitter
}

type MessageHandler = (message: any) => any | void

export function createWebsocket({remoteWindow}: {remoteWindow: any}) {

  const state: WebsocketState = {
    remoteWindow: remoteWindow,
    event: new EventEmitter(),
  }

  window.addEventListener('message', (event) => {
    const {data, source} = event
    if (source !== remoteWindow) {
      return
    }
    if (!isServerMessage(data)) {
      return
    }
    state.event.emit(data[serverMsgTypeKey])
  })
  const onMessage = function (fn: MessageHandler) {
    const handler = (msg: ServerMessageWebsocketMessage) => {
      fn(msg.message)
    }
    state.event.on(ServerMsgType.websocket_message, handler)
    return () => {
      state.event.off(ServerMsgType.websocket_message, handler)
    }
  }
  const onceMessage = function (fn: MessageHandler) {
    const handler = (msg: ServerMessageWebsocketMessage) => {
      fn(msg.message)
    }
    state.event.once(ServerMsgType.websocket_message, handler)
  }
  const sendMessage = function (message: any) {
    if (typeof message === 'undefined') {
      throw new Error('sendMessage(message): message required')
    }
    const msg: ServerMessageWebsocketMessage = {
      [serverMsgTypeKey]: ServerMsgType.websocket_message,
      message,
    }
    state.remoteWindow.postMessage(msg, '*')
  }

  return {
    onMessage,
    sendMessage,
    onceMessage,
  }
}
