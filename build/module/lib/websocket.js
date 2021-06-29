import EventEmitter from 'eventemitter3';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi93ZWJzb2NrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxZQUFZLE1BQU0sZUFBZSxDQUFBO0FBQ3hDLE9BQU8sRUFBaUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxNQUFNLFNBQVMsQ0FBQTtBQVN6RyxNQUFNLFVBQVUsZUFBZSxDQUFDLEVBQUMsWUFBWSxFQUFzQjtJQUVqRSxNQUFNLEtBQUssR0FBbUI7UUFDNUIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsS0FBSyxFQUFFLElBQUksWUFBWSxFQUFFO0tBQzFCLENBQUE7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDM0MsTUFBTSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsR0FBRyxLQUFLLENBQUE7UUFDNUIsSUFBSSxNQUFNLEtBQUssWUFBWSxFQUFFO1lBQzNCLE9BQU07U0FDUDtRQUNELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUIsT0FBTTtTQUNQO1FBQ0QsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtJQUMxQyxDQUFDLENBQUMsQ0FBQTtJQUNGLE1BQU0sU0FBUyxHQUFHLFVBQVUsRUFBa0I7UUFDNUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFrQyxFQUFFLEVBQUU7WUFDckQsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNqQixDQUFDLENBQUE7UUFDRCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDeEQsT0FBTyxHQUFHLEVBQUU7WUFDVixLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDM0QsQ0FBQyxDQUFBO0lBQ0gsQ0FBQyxDQUFBO0lBQ0QsTUFBTSxXQUFXLEdBQUcsVUFBVSxFQUFrQjtRQUM5QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQWtDLEVBQUUsRUFBRTtZQUNyRCxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pCLENBQUMsQ0FBQTtRQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUM1RCxDQUFDLENBQUE7SUFDRCxNQUFNLFdBQVcsR0FBRyxVQUFVLE9BQVk7UUFDeEMsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUU7WUFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO1NBQzFEO1FBQ0QsTUFBTSxHQUFHLEdBQWtDO1lBQ3pDLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxhQUFhLENBQUMsaUJBQWlCO1lBQ25ELE9BQU87U0FDUixDQUFBO1FBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBQzFDLENBQUMsQ0FBQTtJQUVELE9BQU87UUFDTCxTQUFTO1FBQ1QsV0FBVztRQUNYLFdBQVc7S0FDWixDQUFBO0FBQ0gsQ0FBQyJ9