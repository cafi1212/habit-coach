import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

async function main() {
  const login = process.env.SURGE_LOGIN || "";
  const token = process.env.SURGE_TOKEN || "";

  if (!login || !token) {
    console.log("=== Surge Credentials Missing in Environment ===");
    console.log("To deploy to Surge from this secure, automated environment:");
    console.log("1. Go to the Settings / Secrets panel in the AI Studio sidebar.");
    console.log("2. Add two new secret/environment variables:");
    console.log("   - SURGE_LOGIN (your Surge email address)");
    console.log("   - SURGE_TOKEN (your Surge Token, generated on your local machine using 'npx surge token')");
    console.log("3. Once added, message the agent to try deploying again!");
    console.log("================================================");
    return;
  }

  console.log(`Found credentials. Deploying on behalf of ${login}...`);

  console.log("Step 1: Running Vite Build...");
  try {
    execSync("npx vite build", { stdio: "inherit" });
    const indexHtml = path.join(process.cwd(), "dist", "index.html");
    const fallbackHtml = path.join(process.cwd(), "dist", "200.html");
    if (fs.existsSync(indexHtml)) {
      fs.copyFileSync(indexHtml, fallbackHtml);
      console.log("Copied index.html to 200.html for Surge client-side routing.");
    }
  } catch (err) {
    console.error("Vite Build failed:", err);
    process.exit(1);
  }

  console.log("Step 2: Deploying to Surge...");
  try {
    // Run surge using env variables in execution context
    execSync("npx surge ./dist habit-coach-ten.surge.sh", {
      stdio: "inherit",
      env: {
        ...process.env,
        SURGE_LOGIN: login,
        SURGE_TOKEN: token,
      },
    });
    console.log("\n⚡ Success! Application successfully deployed to Surge.sh:");
    console.log("👉 https://habit-coach-ten.surge.sh");
  } catch (err: any) {
    console.error("\nDeployment to Surge failed:", err.message);
  }
}

main().catch(console.error);
