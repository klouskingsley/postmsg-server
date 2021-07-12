// import EventEmitter, {EventEmitter, EventEmitterStatic} from 'eventemitter3'
import { EventEmitter } from 'events';
import { serverMsgTypeKey, ServerMsgType, ErrorType, isServerMessage } from './const';
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
            requestId
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
        if (data[serverMsgTypeKey] === ServerMsgType.http_ping) {
            saveClient(source);
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_pong };
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
        state.event.emit(data[serverMsgTypeKey], data);
    });
    const ping = function () {
        return new Promise((resolve) => {
            const msg = { [serverMsgTypeKey]: ServerMsgType.http_ping };
            state.serverWindow.postMessage(msg, '*');
            state.event.on(ServerMsgType.http_pong, resolve);
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
            pingUntilPong().then(() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaHR0cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrRUFBK0U7QUFDL0UsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNyQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQTRCLGFBQWEsRUFBRSxTQUFTLEVBQTRDLGVBQWUsRUFBQyxNQUFNLFNBQVMsQ0FBQTtBQUN2SixPQUFPLEVBQUMsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLFFBQVEsQ0FBQTtBQXFCdEMsTUFBTSxVQUFVLGdCQUFnQixDQUEyRSxFQUFDLElBQUksRUFBaUI7SUFDL0gsSUFBSSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7UUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrRUFBa0UsQ0FBQyxDQUFBO0tBQ3BGO0lBQ0QsTUFBTSxLQUFLLEdBQWdCO1FBQ3pCLFVBQVUsRUFBRSxFQUFFO1FBQ2QsSUFBSTtRQUNKLGFBQWEsRUFBRSxJQUFJLEdBQUcsRUFBcUI7S0FDNUMsQ0FBQTtJQUVELE1BQU0sZUFBZSxHQUFjLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUE7SUFDNUYsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFO1FBQ3hCLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzdCLE1BQU0sR0FBRyxHQUFrQixFQUFDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxhQUFhLENBQUMsaUJBQWlCLEVBQUMsQ0FBQTtZQUNoRixHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUMzQixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQTtJQUNELE1BQU0sVUFBVSxHQUFHLENBQUMsTUFB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