import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "../dist/server");

function fixImports(dir) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (filePath.endsWith(".js")) {
      let content = readFileSync(filePath, "utf8");

      // Regex to match import statements without .js
      content = content.replace(
        /from\s+['"](\.\.?\/.*?)(?<!\.js)['"]/g,
        'from "$1.js"'
      );

      writeFileSync(filePath, content, "utf8");
    }
  });
}

fixImports(distDir);
