import express from 'express';

import ConfigHandler from './configHandler';

import MiddlewareRoute from './routes/middleware';
import Root from './routes/root';
import Robots from './routes/robots';
import PlayRoute from './routes/play';
import Error404Route from './routes/error404';

import { ICredentialsFile } from './interfaces';

export default class Server {
    app: any;
    credentials: ICredentialsFile;
    server: any;
    updateInterval: any;

    constructor() {
        this.credentials = ConfigHandler.Load();
        this.HandleUpdateCredentials();
    }

    Start(): void
    {
        if (!this.app) {
            this.app = express();
            this.RegisterRoutes();
            this.server = this.app.listen(this.credentials.port, () => {
                console.log(`🌍 What I Am Playing Web Server running on port ${this.credentials.port} !`);
            });
        } else {
            throw new Error("Server is already running!");
        }
    }

    Stop(): void
    {
        if (this.app) {
            console.log(`Stopping server...`);
            this.server.close();
            this.app = undefined;
            clearInterval(this.updateInterval);
        } else {
            throw new Error("Server is not running!");
        }
    }

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
    }

    private RegisterRoutes(): void
    {
        this.app.all('*', (req: any, res: any, next: any) => MiddlewareRoute(req, res, next));
        this.app.get('/', (req: any, res: any) => Root(req, res));
        this.app.get('/robots.txt', (req: any, res: any) => Robots(req, res));
        this.app.get('/play', (req: any, res: any) => PlayRoute(req, res, this.credentials));
        this.app.all('*', (_: any, res: any) => Error404Route(_, res));
    }
}