"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.uniqueId = void 0;
function uniqueId() {
    const now = Date.now();
    const random = Math.random();
    return `${now}-${random}`;
}
exports.uniqueId = uniqueId;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxTQUFnQixRQUFRO0lBQ3RCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDNUIsT0FBTyxHQUFHLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQTtBQUMzQixDQUFDO0FBSkQsNEJBSUM7QUFFTSxNQUFNLEtBQUssR0FBRyxDQUFDLEVBQVUsRUFBRSxFQUFFLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUExRSxRQUFBLEtBQUssU0FBcUUifQ==