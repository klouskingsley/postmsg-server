// import * as EventEmitter from 'eventemitter3'
import { EventEmitter } from 'events';
import { ServerMsgType, serverMsgTypeKey, isServerMessage } from './const';
export function createWebsocket({ remoteWindow }) {
    const state = {
        remoteWindow: remoteWindow,
        event: new EventEmitter(),
    };
    window.addEventListener('message', (event) => {
        const { data, source } = event;
        if (source !== remoteWindow) {
            return;
        }
        if (!isServerMessage(data)) {
            return;
        }
        state.event.emit(data[serverMsgTypeKey]);
    });
    const onMessage = function (fn) {
        const handler = (msg) => {
            fn(msg.message);
        };
        state.event.on(ServerMsgType.websocket_message, handler);
        return () => {
            state.event.off(ServerMsgType.websocket_message, handler);
        };
    };
    const onceMessage = function (fn) {
        const handler = (msg) => {
            fn(msg.message);
        };
        state.event.once(ServerMsgType.websocket_message, handler);
    };
    const sendMessage = function (message) {
        if (typeof message === 'undefined') {
            throw new Error('sendMessage(message): message required');
        }
        const msg = {
            [serverMsgTypeKey]: ServerMsgType.websocket_message,
            message,
        };
        state.remoteWindow.postMessage(msg, '*');
    };
    return {
        onMessage,
        sendMessage,
        onceMessage,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93ZWJzb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsZ0RBQWdEO0FBQ2hELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUE7QUFDbkMsT0FBTyxFQUFpQyxhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLE1BQU0sU0FBUyxDQUFBO0FBU3pHLE1BQU0sVUFBVSxlQUFlLENBQUMsRUFBQyxZQUFZLEVBQXNCO0lBRWpFLE1BQU0sS0FBSyxHQUFtQjtRQUM1QixZQUFZLEVBQUUsWUFBWTtRQUMxQixLQUFLLEVBQUUsSUFBSSxZQUFZLEVBQUU7S0FDMUIsQ0FBQTtJQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMzQyxNQUFNLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxHQUFHLEtBQUssQ0FBQTtRQUM1QixJQUFJLE1BQU0sS0FBSyxZQUFZLEVBQUU7WUFDM0IsT0FBTTtTQUNQO1FBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQixPQUFNO1NBQ1A7UUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxTQUFTLEdBQUcsVUFBVSxFQUFrQjtRQUM1QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtDLEVBQUUsRUFBRTtZQUNyRCxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQTtRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN4RCxPQUFPLEdBQUcsRUFBRTtZQUNWLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMzRCxDQUFDLENBQUE7SUFDSCxDQUFDLENBQUE7SUFDRCxNQUFNLFdBQVcsR0FBRyxVQUFVLEVBQWtCO1FBQzlDLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBa0MsRUFBRSxFQUFFO1lBQ3JELEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDakIsQ0FBQyxDQUFBO1FBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQzVELENBQUMsQ0FBQTtJQUNELE1BQU0sV0FBVyxHQUFHLFVBQVUsT0FBWTtRQUN4QyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUE7U0FDMUQ7UUFDRCxNQUFNLEdBQUcsR0FBa0M7WUFDekMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUI7WUFDbkQsT0FBTztTQUNSLENBQUE7UUFDRCxLQUFLLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDMUMsQ0FBQyxDQUFBO0lBRUQsT0FBTztRQUNMLFNBQVM7UUFDVCxXQUFXO1FBQ1gsV0FBVztLQUNaLENBQUE7QUFDSCxDQUFDIn0=