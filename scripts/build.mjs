import {copyFileSync,readFileSync,writeFileSync} from 'node:fs';
copyFileSync('index.html','dist/index.html');copyFileSync('styles.css','dist/styles.css');
const code=['engine','data','simulation','app'].map(n=>readFileSync(`dist/js/${n}.js`,'utf8').replace(/^import .*?;\s*$/gm,'').replace(/^export\s+/gm,'')).join('\n');
const html=readFileSync('index.html','utf8').replace('<link rel="stylesheet" href="styles.css">',`<style>${readFileSync('styles.css','utf8')}</style>`).replace('<script type="module" src="js/app.js"></script>',`<script>${code.replaceAll('</script','<\\/script')}</script>`);writeFileSync('dist/chronocity.html',html);
