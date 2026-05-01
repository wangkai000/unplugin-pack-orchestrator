import { createArchive } from '../dist/index.js';
import path from 'path';
import fs from 'fs';

const testDir = path.resolve(process.cwd(), 'dist');
fs.mkdirSync(testDir, { recursive: true });
fs.writeFileSync(path.join(testDir, 'index.html'), '<html><body>Hello World</body></html>');
fs.writeFileSync(path.join(testDir, 'app.js'), 'console.log("hello world");');
fs.mkdirSync(path.join(testDir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(testDir, 'assets', 'style.css'), 'body { color: red; background: blue; }');

console.log('Testing archive creation...');

try {
  const result = await createArchive({
    format: 'zip',
    fileName: 'test-archive-[name]',
    verbose: true,
  }, process.cwd(), {}, true);

  console.log('Archive created:', result);

  // Check file exists
  if (fs.existsSync(result)) {
    const stats = fs.statSync(result);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('✅ ZIP test passed!');
  }
} catch (error) {
  console.error('❌ Test failed:', error);
}

// Test 7z
try {
  const result7z = await createArchive({
    format: '7z',
    fileName: 'test-7z-[name]',
    verbose: true,
  }, process.cwd(), {}, true);

  console.log('7Z Archive created:', result7z);

  if (fs.existsSync(result7z)) {
    const stats = fs.statSync(result7z);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('✅ 7Z test passed!');
  }
} catch (error) {
  console.error('❌ 7Z test failed:', error);
}

// Test tar.gz
try {
  const resultTar = await createArchive({
    format: 'tar.gz',
    fileName: 'test-tar-[name]',
    verbose: true,
  }, process.cwd(), {}, true);

  console.log('TAR.GZ Archive created:', resultTar);

  if (fs.existsSync(resultTar)) {
    const stats = fs.statSync(resultTar);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('✅ TAR.GZ test passed!');
  }
} catch (error) {
  console.error('❌ TAR.GZ test failed:', error);
}
