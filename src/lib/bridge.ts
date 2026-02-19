// Helper to check if we are running inside React Native WebView
export const isWebView = () => {
    return typeof window !== 'undefined' && (window as any).ReactNativeWebView;
};

// Message types
export type BridgeMessage =
    | { type: 'ACTIVITY_COMPLETE'; data: { score: number; timeSpent: number } }
    | { type: 'UPDATE_XP'; data: { amount: number } }
    | { type: 'LOG_DEBUG'; data: { message: string } };

// Send message to React Native
export const sendToNative = (message: BridgeMessage) => {
    if (isWebView()) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
        // Fallback for browser testing
        console.log('🔌 [Bridge Mock] Sent to Native:', message);
    }
};
