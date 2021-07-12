"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpClient = exports.createHttpServer = void 0;
// import EventEmitter, {EventEmitter, EventEmitterStatic} from 'eventemitter3'
const events_1 = require("events");
const const_1 = require("./const");
const util_1 = require("./util");
function createHttpServer({ name }) {
    if (!name || typeof name !== 'string') {
        throw new Error(`createHttpServer(option): option.name require a non-empty string`);
    }
    const state = {
        clientList: [],
        name,
        methodHandler: new Map()
    };
    const noMethodHandler = () => Promise.reject(new Error(const_1.ErrorType.no_such_method));
    const emitCloseMsg = () => {
        state.clientList.forEach(win => {
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_server_close };
            win.postMessage(msg, '*');
        });
    };
    const saveClient = (source) => {
        if (state.clientList.indexOf(source) < 0) {
            state.clientList.push(source);
        }
    };
    const handleRequest = async (requestId, method, param, origin, source) => {
        // 保存 source, 供 window.close 时通知
        saveClient(source);
        // 获取 处理 函数
        let fn = noMethodHandler;
        if (state.methodHandler.has(method)) {
            fn = state.methodHandler.get(method);
        }
        // 得到处理结果
        let res = { response: '', error: '' };
        try {
            res.response = await fn(param, origin, source);
        }
        catch (err) {
            res.error = err.message;
        }
        // 返回处理结果
        const msg = Object.assign(Object.assign({}, res), { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_response, requestId });
        source.postMessage(msg, origin);
    };
    const messageRequestHandler = (data, origin, source) => {
        if (data[const_1.serverMsgTypeKey] !== const_1.ServerMsgType.http_request) {
            return;
        }
        const { serverName, method, param, requestId } = data;
        if (serverName !== state.name) {
            return;
        }
        if (!method) {
            return;
        }
        if (source) {
            handleRequest(requestId, method, param, origin, source);
        }
    };
    const messagePingHandler = (data, origin, source) => {
        if (data[const_1.serverMsgTypeKey] === const_1.ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_pong };
            source.postMessage(msg, origin);
        }
    };
    window.addEventListener('message', (event) => {
        const { data, origin, source } = event;
        if (!const_1.isServerMessage(data)) {
            return;
        }
        messageRequestHandler(data, origin, source);
        messagePingHandler(data, origin, source);
    });
    const originOnbeforeunload = window.onbeforeunload;
    window.onbeforeunload = function (event) {
        emitCloseMsg();
        if (typeof originOnbeforeunload === 'function') {
            originOnbeforeunload.call(window, event);
        }
    };
    const on = function (method, callback) {
        const has = state.methodHandler.has(method);
        if (has) {
            console.warn(`server.on: ${method}'s previous handler will be override`);
        }
        // (param?: any) => Promise<any>
        state.methodHandler.set(method, callback);
    };
    return {
        on,
    };
}
exports.createHttpServer = createHttpServer;
function createHttpClient({ name, serverWindow }) {
    if (!name || typeof name !== 'string') {
        throw new Error('createHttpClient(option): option.name require a non-empty string');
    }
    if (!serverWindow) {
        throw new Error('createHttpClient(option): option.serverWindow required');
    }
    const state = {
        name,
        serverWindow,
        event: new events_1.EventEmitter()
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (serverWindow !== source) {
            return;
        }
        if (!const_1.isServerMessage(data)) {
            return;
        }
        state.event.emit(data[const_1.serverMsgTypeKey], data);
    });
    const ping = function () {
        return new Promise((resolve) => {
            const msg = { [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_ping };
            state.serverWindow.postMessage(msg, '*');
            state.event.on(const_1.ServerMsgType.http_pong, resolve);
        });
    };
    const pingUntilPong = async function () {
        let receivedPong = false;
        for (;;) {
            ping().then(() => {
                receivedPong = true;
            });
            if (receivedPong) {
                break;
            }
            await util_1.sleep(50);
        }
    };
    const request = function (option) {
        const { method } = option;
        if (!method || typeof method !== 'string') {
            throw new Error('httpClient.request(method, param): method is required');
        }
        const timeout = typeof option.timeout === 'number' ? option.timeout : 0;
        const requestId = util_1.uniqueId();
        const msg = {
            [const_1.serverMsgTypeKey]: const_1.ServerMsgType.http_request,
            method,
            param: option.param,
            requestId: requestId,
            serverName: state.name,
        };
        // 先进行ping
        return new Promise((resolve, reject) => {
            // 设置超时
            let isFail = false;
            if (timeout > 0) {
                setTimeout(() => {
                    isFail = true;
                    reject(new Error(const_1.ErrorType.timeout));
                }, timeout);
            }
            // 先进行 ping, todo 可能需要不断的ping(pingUntilPong), ping 通后再进行 request
            pingUntilPong().then(() => {
                if (isFail) {
                    return;
                }
                state.serverWindow.postMessage(msg, '*');
                state.event.on(const_1.ServerMsgType.http_response, (responseMsg) => {
                    if (responseMsg.requestId === msg.requestId) {
                        if (responseMsg.error) {
                            reject(new Error(responseMsg.error));
                        }
                        else {
                            resolve(responseMsg.response);
                        }
                    }
                });
            });
        });
    };
    return {
        request
    };
}
exports.createHttpClient = createHttpClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrRUFBK0U7QUFDL0UsbUNBQXFDO0FBQ3JDLG1DQUF1SjtBQUN2SixpQ0FBc0M7QUFxQnRDLFNBQWdCLGdCQUFnQixDQUEyRSxFQUFDLElBQUksRUFBaUI7SUFDL0gsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFBO0tBQ3BGO0lBQ0QsTUFBTSxLQUFLLEdBQWdCO1FBQ3pCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsSUFBSTtRQUNKLGFBQWEsRUFBRSxJQUFJLEdBQUcsRUFBcUI7S0FDNUMsQ0FBQTtJQUVELE1BQU0sZUFBZSxHQUFjLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzVGLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtRQUN4QixLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QixNQUFNLEdBQUcsR0FBa0IsRUFBQyxDQUFDLHdCQUFnQixDQUFDLEVBQUUscUJBQWEsQ0FBQyxpQkFBaUIsRUFBQyxDQUFBO1lBQ2hGLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQzNCLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFBO0lBQ0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUNwQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN4QyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtTQUM5QjtJQUNILENBQUMsQ0FBQTtJQUNELE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxTQUFpQixFQUFFLE1BQWMsRUFBRSxLQUFVLEVBQUUsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO1FBQzVHLGdDQUFnQztRQUNoQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFbEIsV0FBVztRQUNYLElBQUksRUFBRSxHQUFjLGVBQWUsQ0FBQTtRQUNuQyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ25DLEVBQUUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsQ0FBQTtTQUN0QztRQUVELFNBQVM7UUFDVCxJQUFJLEdBQUcsR0FBZ0MsRUFBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQTtRQUNoRSxJQUFJO1lBQ0YsR0FBRyxDQUFDLFFBQVEsR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUMsTUFBTSxFQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQzdDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUE7U0FDeEI7UUFFRCxTQUFTO1FBQ1QsTUFBTSxHQUFHLG1DQUNKLEdBQUcsS0FDTixDQUFDLHdCQUFnQixDQUFDLEVBQUUscUJBQWEsQ0FBQyxhQUFhLEVBQy9DLFNBQVMsR0FDVixDQUFBO1FBQ0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDakMsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxxQkFBcUIsR0FBRyxDQUFDLElBQThCLEVBQUUsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO1FBQy9GLElBQUksSUFBSSxDQUFDLHdCQUFnQixDQUFDLEtBQUsscUJBQWEsQ0FBQyxZQUFZLEVBQUU7WUFDekQsT0FBTTtTQUNQO1FBQ0QsTUFBTSxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBQyxHQUFHLElBQUksQ0FBQTtRQUNuRCxJQUFJLFVBQVUsS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFO1lBQzdCLE9BQU07U0FDUDtRQUNELElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFNO1NBQ1A7UUFDRCxJQUFJLE1BQU0sRUFBRTtZQUNWLGFBQWEsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBZ0IsQ0FBQyxDQUFBO1NBQ2xFO0lBQ0gsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLElBQW1CLEVBQUUsTUFBYyxFQUFFLE1BQWMsRUFBRSxFQUFFO1FBQ2pGLElBQUksSUFBSSxDQUFDLHdCQUFnQixDQUFDLEtBQUsscUJBQWEsQ0FBQyxTQUFTLEVBQUU7WUFDdEQsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ2xCLE1BQU0sR0FBRyxHQUFrQixFQUFDLENBQUMsd0JBQWdCLENBQUMsRUFBRSxxQkFBYSxDQUFDLFNBQVMsRUFBQyxDQUFBO1lBQ3hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1NBQ2hDO0lBQ0gsQ0FBQyxDQUFBO0lBRUQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzNDLE1BQU0sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBQyxHQUFHLEtBQUssQ0FBQTtRQUNwQyxJQUFJLENBQUMsdUJBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQixPQUFNO1NBQ1A7UUFDRCxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQWdCLENBQUMsQ0FBQTtRQUNyRCxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQWdCLENBQUMsQ0FBQTtJQUNwRCxDQUFDLENBQUMsQ0FBQTtJQUNGLE1BQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQTtJQUNsRCxNQUFNLENBQUMsY0FBYyxHQUFHLFVBQVUsS0FBSztRQUNyQyxZQUFZLEVBQUUsQ0FBQTtRQUNkLElBQUksT0FBTyxvQkFBb0IsS0FBSyxVQUFVLEVBQUU7WUFDOUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtTQUN6QztJQUNILENBQUMsQ0FBQztJQUVGLE1BQU0sRUFBRSxHQUFHLFVBQThDLE1BQWMsRUFBRSxRQUFnRztRQUN2SyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFnQixDQUFDLENBQUE7UUFDckQsSUFBSSxHQUFHLEVBQUU7WUFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsTUFBTSxzQ0FBc0MsQ0FBQyxDQUFBO1NBQ3pFO1FBQ0QsZ0NBQWdDO1FBQ2hDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQWdCLEVBQUUsUUFBZSxDQUFDLENBQUE7SUFDNUQsQ0FBQyxDQUFBO0lBRUQsT0FBTztRQUNMLEVBQUU7S0FDSCxDQUFBO0FBQ0gsQ0FBQztBQW5HRCw0Q0FtR0M7QUFRRCxTQUFnQixnQkFBZ0IsQ0FBMkUsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFvQztJQUVoSyxJQUFJLENBQUMsSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUE7S0FDcEY7SUFDRCxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQTtLQUMxRTtJQUVELE1BQU0sS0FBSyxHQUFnQjtRQUN6QixJQUFJO1FBQ0osWUFBWTtRQUNaLEtBQUssRUFBRSxJQUFJLHFCQUFZLEVBQUU7S0FDMUIsQ0FBQTtJQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMzQyxNQUFNLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxHQUFHLEtBQUssQ0FBQTtRQUM1QixJQUFJLFlBQVksS0FBSyxNQUFNLEVBQUU7WUFDM0IsT0FBTTtTQUNQO1FBQ0QsSUFBSSxDQUFDLHVCQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUIsT0FBTTtTQUNQO1FBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUFnQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLENBQUE7SUFFRixNQUFNLElBQUksR0FBRztRQUNYLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUM3QixNQUFNLEdBQUcsR0FBa0IsRUFBQyxDQUFDLHdCQUFnQixDQUFDLEVBQUUscUJBQWEsQ0FBQyxTQUFTLEVBQUMsQ0FBQTtZQUN4RSxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDeEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMscUJBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDbEQsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUE7SUFDRCxNQUFNLGFBQWEsR0FBRyxLQUFLO1FBQ3pCLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQTtRQUN4QixTQUFTO1lBQ1AsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDZixZQUFZLEdBQUcsSUFBSSxDQUFBO1lBQ3JCLENBQUMsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxZQUFZLEVBQUU7Z0JBQ2hCLE1BQU07YUFDUDtZQUNELE1BQU0sWUFBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO0lBQ0gsQ0FBQyxDQUFBO0lBRUQsTUFBTSxPQUFPLEdBQUcsVUFBOEMsTUFJN0Q7UUFDQyxNQUFNLEVBQUMsTUFBTSxFQUFDLEdBQUcsTUFBTSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFO1lBQ3pDLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQTtTQUN6RTtRQUNELE1BQU0sT0FBTyxHQUFHLE9BQU8sTUFBTSxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2RSxNQUFNLFNBQVMsR0FBRyxlQUFRLEVBQUUsQ0FBQTtRQUM1QixNQUFNLEdBQUcsR0FBNkI7WUFDcEMsQ0FBQyx3QkFBZ0IsQ0FBQyxFQUFFLHFCQUFhLENBQUMsWUFBWTtZQUM5QyxNQUFNO1lBQ04sS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1lBQ25CLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSTtTQUN2QixDQUFBO1FBRUQsVUFBVTtRQUNWLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsT0FBTztZQUNQLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTtZQUNsQixJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUU7Z0JBQ2YsVUFBVSxDQUFDLEdBQUcsRUFBRTtvQkFDZCxNQUFNLEdBQUcsSUFBSSxDQUFBO29CQUNiLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7Z0JBQ3RDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQTthQUNaO1lBQ0QsZ0VBQWdFO1lBQ2hFLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksTUFBTSxFQUFFO29CQUNWLE9BQU07aUJBQ1A7Z0JBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUN4QyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxxQkFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLFdBQXNDLEVBQUUsRUFBRTtvQkFDckYsSUFBSSxXQUFXLENBQUMsU0FBUyxLQUFLLEdBQUcsQ0FBQyxTQUFTLEVBQUU7d0JBQzNDLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRTs0QkFDckIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO3lCQUNyQzs2QkFBTTs0QkFDTCxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFBO3lCQUM5QjtxQkFDRjtnQkFDSCxDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFRLENBQUE7SUFDWCxDQUFDLENBQUE7SUFFRCxPQUFPO1FBQ0wsT0FBTztLQUNSLENBQUM7QUFDSixDQUFDO0FBakdELDRDQWlHQyJ9