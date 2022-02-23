import Server from './server';

import log from './services/logger';

/**
 * 
 * Kernel class: this loads the whole application.
 * 
 * Termination handlers are placed to safely stop the server if it is running.
 * 
 * After that, we declare `s` as our server class variable and invoke its start method.
 * 
 */
export default function (): void 
{
    const signals = [
        'SIGINT', 'SIGTERM'
    ];
    
    for (let idx in signals) {
        process.on(signals[idx], () => halt(s));
    }

    function halt(s: Server) {
        s.Stop();
        log(`Bye!`);
    }

    const s = new Server();
    s.Start();
}