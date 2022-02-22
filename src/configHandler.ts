import * as fs from 'fs';
import * as process from 'process';
import Requester from './services/request';

import { ICredentialsFile, IQueryParams } from './interfaces';

const configFilePath = `${process.cwd()}/credentials.json`;

export default {
    /**
     * Method to load credentials file and verify its integrity
     * 
     * The file will be loaded, and the existence of specific fields will be verified.
     * If such items do not exist, an exception will be thrown.
     * Otherwise, an object wil the file contents will be returned.
     * 
     * @returns ICredentialsFile credentials
     */
    Load(): ICredentialsFile
    {
        if (!fs.existsSync(configFilePath)) {
            throw new Error(
                `Missing "credentials.json" file in project root folder! Please create the file as instructed in the project README.`
            );
        }
        
        const configuration: ICredentialsFile = JSON.parse(fs.readFileSync(configFilePath, {encoding: `utf-8`}));
        if (
            !configuration.client ||
            !configuration.secret ||
            !configuration.port
        ) {
            throw new Error(
                `Credentials configuration file is missing either of the following parameters: port, client, secret. Please create the file as instructed in the project README.`
            );
        }
        
        if (!configuration.refreshUrl) {
            throw new Error(
                `Missing refresh URL. Please add the callback URL used to obtain the token inside the "credentials.json" file. If you followed the example given in the README file, you should enter "http://localhost/callback/" as the value.`
            );
        }
        
        if (!configuration.token) {
            throw new Error(
                `Credentials are missing a token. To retrieve it, please follow this link: https://accounts.spotify.com/authorize?client_id=${configuration.client}&response_type=code&scope=user-read-currently-playing,user-read-recently-played&redirect_uri=${configuration.refreshUrl}`
            );
        }
    
        return configuration;
    },
    /**
     * Queries the Spotify API to update the existing token in the system.
     * Once the token is updated or the Spotify API notifies that no update is needed,
     * we store the data and return the credentials file as if it were brand new.
     * 
     * @returns Promise<ICredentialsFile> credentials
     */
    async UpdateCredentials(): Promise<ICredentialsFile>
    {
        const credentials: ICredentialsFile = this.Load();
        const encodedToken = Buffer.from(`${credentials.client}:${credentials.secret}`).toString('base64');
        let queryParams: IQueryParams = {
            grant_type: 'authorization_code',
            redirect_uri: credentials.refreshUrl,
            code: credentials.token
        };
        if (credentials.refreshToken) {
            queryParams = {
                grant_type: 'refresh_token', 
                refresh_token: credentials.refreshToken
            };
        }
        try {
            const res = await Requester({
                url: 'https://accounts.spotify.com/api/token',
                method: 'POST',
                headers: {
                    Authorization: `Basic ${encodedToken}`
                }, 
                params: queryParams
            });
            if (res.data.access_token) {
                credentials.token = res.data.access_token;
            }
            if (res.data.refresh_token) {
                credentials.refreshToken = res.data.refresh_token;
            }
            fs.writeFileSync(configFilePath, JSON.stringify(credentials, null, 4));
            console.log('Updated credentials');
            return credentials;
        } catch (err: any) {
            const errorLogFilePath = `${__dirname}/messages.log`;
            if (!fs.existsSync(errorLogFilePath)) {
                fs.writeFileSync(errorLogFilePath, '');
            }
            console.error(`Something went wrong when updating the credentials. Please check the logs file located at ${errorLogFilePath} for more details.`);
            fs.appendFileSync(errorLogFilePath, '== NEW ERROR ==\n');
            fs.appendFileSync(errorLogFilePath, JSON.stringify(err) + '\n');
            if (err.response) {
                fs.appendFileSync(errorLogFilePath, JSON.stringify(err.response.data) + '\n');
            }
            else console.log(err);
            return credentials;
        }
    }
}