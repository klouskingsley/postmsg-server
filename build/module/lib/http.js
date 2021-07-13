// import EventEmitter, {EventEmitter, EventEmitterStatic} from 'eventemitter3'
import { EventEmitter } from 'events';
import { serverMsgTypeKey, ServerMsgType, ErrorType, isServerMessage, getHttpRequestEventKey } from './const';
import { uniqueId, sleep } from './util';
export function createHttpServer({ name }) {
    if (!name || typeof name !== 'string') {
        throw new Error(`createHttpServer(option): option.name require a non-empty string`);
    }
    const state = {
        clientList: [],
        name,
        methodHandler: new Map()
    };
    const noMethodHandler = () => Promise.reject(new Error(ErrorType.no_such_method));
    const emitCloseMsg = () => {
        state.clientList.forEach(win => {
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_server_close };
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
        const msg = {
            ...res,
            [serverMsgTypeKey]: ServerMsgType.http_response,
            requestId,
            serverName: state.name,
        };
        source.postMessage(msg, origin);
    };
    const messageRequestHandler = (data, origin, source) => {
        if (data[serverMsgTypeKey] !== ServerMsgType.http_request) {
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
        if (data[serverMsgTypeKey] !== ServerMsgType.http_ping) {
            return;
        }
        const { serverName, requestId } = data;
        if (serverName !== state.name) {
            return;
        }
        if (data[serverMsgTypeKey] === ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_ping, requestId, serverName };
            source.postMessage(msg, origin);
        }
    };
    window.addEventListener('message', (event) => {
        const { data, origin, source } = event;
        if (!isServerMessage(data)) {
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
export function createHttpClient({ name, serverWindow }) {
    if (!name || typeof name !== 'string') {
        throw new Error('createHttpClient(option): option.name require a non-empty string');
    }
    if (!serverWindow) {
        throw new Error('createHttpClient(option): option.serverWindow required');
    }
    const state = {
        name,
        serverWindow,
        event: new EventEmitter()
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (serverWindow !== source) {
            return;
        }
        if (!isServerMessage(data)) {
            return;
        }
        const eventKey = getHttpRequestEventKey(data);
        state.event.emit(data[serverMsgTypeKey], data);
        state.event.emit(eventKey, data);
    });
    const ping = function (msg) {
        return new Promise((resolve) => {
            state.serverWindow.postMessage(msg, '*');
            const eventKey = getHttpRequestEventKey(msg);
            state.event.removeAllListeners(eventKey);
            state.event.on(eventKey, resolve);
        });
    };
    const pingUntilPong = async function (msg) {
        let receivedPong = false;
        for (;;) {
            ping(msg).then(() => {
                receivedPong = true;
            });
            if (receivedPong) {
                break;
            }
            await sleep(50);
        }
    };
    const request = function (option) {
        const { method } = option;
        if (!method || typeof method !== 'string') {
            throw new Error('httpClient.request(method, param): method is required');
        }
        const timeout = typeof option.timeout === 'number' ? option.timeout : 0;
        const requestId = uniqueId();
        const msg = {
            [serverMsgTypeKey]: ServerMsgType.http_request,
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
                    reject(new Error(ErrorType.timeout));
                }, timeout);
            }
            // 先进行 ping, todo 可能需要不断的ping(pingUntilPong), ping 通后再进行 request
            const pingMsg = {
                [serverMsgTypeKey]: ServerMsgType.http_ping,
                requestId: requestId,
                serverName: state.name,
            };
            pingUntilPong(pingMsg).then(() => {
                if (isFail) {
                    return;
                }
                state.serverWindow.postMessage(msg, '*');
                state.event.on(ServerMsgType.http_response, (responseMsg) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrRUFBK0U7QUFDL0UsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNyQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQTRCLGFBQWEsRUFBRSxTQUFTLEVBQTRDLGVBQWUsRUFBcUIsc0JBQXNCLEVBQUMsTUFBTSxTQUFTLENBQUE7QUFDbE0sT0FBTyxFQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxRQUFRLENBQUE7QUFxQnRDLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBMkUsRUFBQyxJQUFJLEVBQWlCO0lBQy9ILElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsa0VBQWtFLENBQUMsQ0FBQTtLQUNwRjtJQUNELE1BQU0sS0FBSyxHQUFnQjtRQUN6QixVQUFVLEVBQUUsRUFBRTtRQUNkLElBQUk7UUFDSixhQUFhLEVBQUUsSUFBSSxHQUFHLEVBQXFCO0tBQzVDLENBQUE7SUFFRCxNQUFNLGVBQWUsR0FBYyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFBO0lBQzVGLE1BQU0sWUFBWSxHQUFHLEdBQUcsRUFBRTtRQUN4QixLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM3QixNQUFNLEdBQUcsR0FBa0IsRUFBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixFQUFDLENBQUE7WUFDaEYsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDM0IsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDLENBQUE7SUFDRCxNQUFNLFVBQVUs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