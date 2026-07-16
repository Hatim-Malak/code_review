import jwt from "jsonwebtoken"
import { Octokit } from "@octokit/rest"
import { createAppAuth} from "@octokit/auth-app"
import dotenv from "dotenv"

dotenv.config()

let privateKeyString = process.env.GITHUB_APP_PRIVATE_KEY || "";
privateKeyString = privateKeyString.replace(/\\n/g, "\n"); // Fix escaped newlines

if (!privateKeyString.includes("BEGIN")) {
    // Try decoding as a base64-encoded PEM file first
    const decoded = Buffer.from(privateKeyString, "base64").toString("utf8");
    if (decoded.includes("BEGIN")) {
        privateKeyString = decoded;
    } else {
        // The user likely copied the base64 content but omitted the -----BEGIN/END----- headers.
        // Let's rebuild the PEM format for them.
        const cleanBase64 = privateKeyString.replace(/\s+/g, ""); // Remove all whitespace
        const lines = cleanBase64.match(/.{1,64}/g)?.join("\n") || "";
        privateKeyString = `-----BEGIN RSA PRIVATE KEY-----\n${lines}\n-----END RSA PRIVATE KEY-----`;
    }
}
privateKeyString = privateKeyString.trim();

export const appJwt = () => {
    const now = Math.floor(Date.now()/1000);
    return jwt.sign(
        {
            iat:now-60,
            exp:now+90*60,
            iss:process.env.GITHUB_APP_ID
        },
        privateKeyString,
        {
            algorithm:"RS256"
        }   
    )
}


export const octokitForInstallation = (installationId) => {
    return new Octokit({
        authStrategy:createAppAuth,
        auth:{
            appId:process.env.GITHUB_APP_ID,
            privateKey: privateKeyString,
            installationId,
        },
    })
}