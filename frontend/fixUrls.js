import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath);
        } else if (f.endsWith('.jsx')) {
            let content = fs.readFileSync(dirPath, 'utf8');
            let newContent = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\}\/api/g, "${import.meta.env.VITE_API_URL.replace(/\\/+$/, '')}/api");
            if (content !== newContent) {
                fs.writeFileSync(dirPath, newContent, 'utf8');
                console.log(`Updated ${f}`);
            }
        }
    });
}
walkDir(path.join(__dirname, 'src'));
