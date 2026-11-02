export const OPEN_WALLY_EVENT = 'wally:open';

// Lets any screen open the WallyBot chat without sharing state
export const openWallyBot = () => window.dispatchEvent(new Event(OPEN_WALLY_EVENT));
