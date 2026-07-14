// Backend/src/lib/repoTree.js
import zlib from "zlib";
import tar from "tar-stream";
import { pipeline } from "stream/promises";

const MAX_FILE_BYTES = 200_000;
const SKIP_PATTERNS = [
  /(^|\/)(dist|build|vendor|node_modules|\.git)\//,
  /\.(lock|min\.js|png|jpg|jpeg|gif|svg|ico|woff2?|zip|pdf)$/i,
];

export async function fetchRepoFiles(octokit, owner, repo, ref) {
  const { url } = await octokit.rest.repos.downloadTarballArchive({ owner, repo, ref });
  const res = await fetch(url); // downloadTarballArchive returns a redirect URL; fetch follows it
  const files = [];

  const extract = tar.extract();
  extract.on("entry", (header, stream, next) => {
    const relativePath = header.name.split("/").slice(1).join("/"); // strip the "<repo>-<sha>/" prefix
    const skip =
      header.type !== "file" ||
      header.size > MAX_FILE_BYTES ||
      SKIP_PATTERNS.some((p) => p.test(relativePath));

    if (skip) {
      stream.resume();
      return next();
    }

    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => {
      files.push({ path: relativePath, content: Buffer.concat(chunks).toString("utf8") });
      next();
    });
    stream.resume();
  });

  await pipeline(res.body, zlib.createGunzip(), extract);
  return files;
}