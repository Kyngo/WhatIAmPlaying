import express from 'express';
import morgan from 'morgan';

import ConfigHandler from './configHandler';

import Middleware from './services/middleware';

import Root from './routes/root';
import Robots from './routes/robots';
import PlayRoute from './routes/play';
import Error404Route from './routes/error404';

import log from "./services/logger";

import { ICredentialsFile } from './interfaces';

/**
 * Server class - handles the Express web server
 */
export default class Server {
    app: any;
    credentials: ICredentialsFile;
    server: any;
    updateInterval: any;

    /**
     * When creating the object, we will load the credentials and update them
     */
    constructor() {
        this.credentials = ConfigHandler.Load();
        this.HandleUpdateCredentials().then(() => {});
    }

    /**
     * This method launches the web server and registers all of its routes
     * @constructor
     */
    Start(): void
    {
        if (!this.app) {
            this.app = express();
            this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
            this.RegisterRoutes();
            this.server = this.app.listen(this.credentials.port, () => {
                log(`🌍 What I Am Playing Web Server running on port ${this.credentials.port} !`);
            });
        } else {
            throw new Error("Server is already running!");
        }
    }

    /**
     * A way to gracefully stop the web server and garbage collect
     * @constructor
     */
    Stop(): void
    {
        if (this.app) {
            log(`Stopping server...`);
            this.server.close();
            this.app = undefined;
            clearInterval(this.updateInterval);
        } else {
            throw new Error("Server is not running!");
        }
    }

    /**
     * Updates the credentials used to connect to the Spotify API
     * @constructor
     * @private
     */
    private async HandleUpdateCredentials(): Promise<void>
    {
        const newCredentials: ICredentialsFile = await ConfigHandler.UpdateCredentials();
        if (newCredentials) {
            this.credentials = newCredentials;
        }
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => {
                this.HandleUpdateCredentials()
            }, 1000 * 60);
        }
        return;
    }

    /**
     * Registers all the routes in the Express server
     * @constructor
     * @private
     */
    private RegisterRoutes(): void
    {
        /**
         * Let's register the middleware first...
         */
        this.app.all('*', Middleware);

        /**
         * Now we register all paths
         */
        this.app.get('/', Root);
        this.app.get('/robots.txt', Robots);
        this.app.get('/play', (req: any, res: any) => PlayRoute(req, res, this.credentials));

        /**
         * We finally register a 404 handler
         */
        this.app.all('*', Error404Route);
    }
}