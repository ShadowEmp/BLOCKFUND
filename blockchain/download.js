const fs = require("fs");
const path = require("path");
const https = require("https");

const cacheDir = path.join(process.env.LOCALAPPDATA, "hardhat-nodejs", "Cache", "compilers", "windows-amd64");
console.log("Cache dir:", cacheDir);

fs.mkdirSync(cacheDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error("Status code " + res.statusCode));
      }
      res.pipe(fs.createWriteStream(dest))
         .on("finish", () => resolve())
         .on("error", reject);
    }).on("error", reject);
  });
}

(async () => {
    try {
        console.log("Downloading list.json...");
        await download("https://binaries.soliditylang.org/windows-amd64/list.json", path.join(cacheDir, "list.json"));
        console.log("Downloading solc 0.8.20...");
        await download("https://binaries.soliditylang.org/windows-amd64/solc-windows-amd64-v0.8.20+commit.a1b79de6.exe", path.join(cacheDir, "solc-windows-amd64-v0.8.20+commit.a1b79de6.exe"));
        console.log("Compiler downloaded successfully!");
    } catch(err) {
        console.error(err);
    }
})();
