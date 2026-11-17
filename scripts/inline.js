// Writes dist/index.html: the page with the game bundle inlined, so the whole game is one file.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'dist/game.js'), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const tag = '<script src="dist/game.js"></script>';
if (!html.includes(tag)) throw new Error('script tag not found in index.html');
fs.writeFileSync(path.join(root, 'dist/index.html'), html.replace(tag, () => '<script>\n' + js + '\n</script>'));
console.log('dist/index.html', (fs.statSync(path.join(root, 'dist/index.html')).size / 1024).toFixed(0) + ' kB');
