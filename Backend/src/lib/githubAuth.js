import jwt from "jsonwebtoken"
import { Octokit } from "@octokit/rest"
import { createAppAuth} from "@octokit/auth-app"
import dotenv from "dotenv"

dotenv.config()

const privateKey  = Buffer.from(process.env.GITHUB_APP_PRIVATE_KEY,"base64")

export const appJwt = () => {
    const now = Math.floor(Date.now()/1000);
    return jwt.sign(
        {
            iat:now-60,
            exp:now+90*60,
            iss:process.env.GITHUB_APP_ID
        },
        privateKey,
        {
            algorithm:"RS256"
        }   
    )
}


export const octokitForInstallation = (InstallationId) => {
    return new Octokit({
        authStrategy:createAppAuth,
        auth:{
            appId:process.env.GITHUB_APP_ID,
            privateKey,
            InstallationId,
        },
    })
}