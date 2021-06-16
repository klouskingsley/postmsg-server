## 限制

parent 可以监听 iframe, iframe 无法监听 parent
parent 可以监听 popup, popup 无法监听 parent

parent -> iframe 发送：

- 发送：paremt.html: iframeWindow.postMessage(msg, origin, transfer)
- 监听: iframe.html: window.on('message')

iframe -> parent：

- 发送: iframe.html: parentWindow.postMessage()
- 监听：parent.html: window.on('message')

parent -> popup:

- 发送: parent.html: popupWindow.postMessage()
- 监听: popup.html: window.on('message')

popup -> parent:

- 发送: popup.html: parentWidnow.postMessage()
- 监听: parent.html: window.on('message')

## rpc 服务

localWindow
remoteWindow

client -> server: postMessage
server -> client: postMessage

websocket(remoteWindow):

- currentWindow.on
  - removeWindowOrigin
- removeWindow.postMessage
- on('')
  - ready
  - message
  - close
  - error 暂时没有这个事件
- getStatus
  - connecting
  - open
  - closing
  - closed
- send('')
- reconnect(比如 popup 刷新) 之后可以继续发，但 request/response 上下文无法恢复，是否可以手动恢复
- await request('method', params)
  - 调用 send 和 on
- response('method', async function (params) {
  return {}
  })
  - 调用 on 和 send

有没有可能一个 localWindow 多个 removeWindow, 显然不需要分布式, localWindow 需要管理, 似乎没有可能，因为是 init 传进去的;
多个 websocket 实例是有可能的，此时 localWindow 处理多个不同的 remoteWindow, remoteWindow 与多个客户端连接

ready 状态处理

- localWindow 连接 remoteWindow 的时候，可能 remoteWindow 还没收到消息无法处理，需要有 ping/pong?
  - 总有一个是先 ready 的，先 ready 的那个不断发消息，直到后 ready 的那个处理
    - 后 ready 的那个如果收到多个不同的先 ready 的 window 要怎么处理
- 一个 local 可能被多个 remote 相连, 按理来说会(on('message')可以知晓是哪个 window)
- 两个确定的 window 之间有多个连接 ?

相对于 http 来说就是一个 port 运行多个服务器，这是不行的，如果我们限制 port 就可以了，每个 port 运行一个服务器

createHttpServer:

- 只处理请求
- 如果 server 断了呢, 那么对所有 client(需要每次处理请求的时候记下来 client) 广播 close

createHttpClient

- 只处理请求
- client 不断发 ping 进行保活(不需要)，挂了就是挂了
- client 需要处理，超时，server close
