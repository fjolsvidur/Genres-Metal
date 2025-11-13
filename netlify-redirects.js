import { readdir, writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

async function generateRedirects() {
  const publicDir = 'public';
  
  if (!existsSync(publicDir)) {
    console.error(`Directory ${publicDir} does not exist. Run 'npx quartz build' first.`);
    process.exit(1);
  }
  
  const redirects = [];
  
  try {
    // Recursively get all HTML files
    async function getHtmlFiles(dir, basePath = '') {
      const files = [];
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Skip certain directories that don't contain content pages
          if (!['static'].includes(entry.name)) {
            const subFiles = await getHtmlFiles(fullPath, relativePath);
            files.push(...subFiles);
          }
        } else if (entry.isFile() && extname(entry.name) === '.html') {
          // Skip index.html and 404.html as they're handled specially
          if (entry.name !== 'index.html' && entry.name !== '404.html') {
            const slug = relativePath.replace(/\.html$/, '');
            files.push({ slug, file: relativePath });
          }
        }
      }
      
      return files;
    }
    
    const htmlFiles = await getHtmlFiles(publicDir);
    
    // Generate redirects for each HTML file
    // Format: /path    /path.html    200
    for (const { slug, file } of htmlFiles) {
      redirects.push(`/${slug}    /${file}    200`);
    }
    
    // Add 404 handler at the end (catch-all)
    redirects.push('/*    /404.html    404');
    
    // Write _redirects file
    const redirectsContent = redirects.join('\n');
    await writeFile(join(publicDir, '_redirects'), redirectsContent);
    console.log(`Generated _redirects file with ${redirects.length} redirect rules`);
  } catch (error) {
    console.error('Error generating redirects:', error);
    process.exit(1);
  }
}

generateRedirects();

