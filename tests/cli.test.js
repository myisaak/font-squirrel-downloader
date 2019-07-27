const fs = require('fs');
const childProcess = require('child_process');

(async () => {
    await testDownload();
    await testDownloadCustomDirectory();
})();

async function testDownload() {
    return new Promise((resolve) => {
        const cliProcess = childProcess.spawn('node', ['bin/font-squirrel-downloader']);

        setTimeout(function(){
            cliProcess.kill('SIGTERM');
        }, 10000);

        cliProcess.on('close', () => {
            const files = fs.readdirSync('.');
            if (files.some(file => /.+-fontfacekit\.zip/.test(file))) {
                resolve();
            } else {
                process.exit(1)
            }
        });
    });
}

async function testDownloadCustomDirectory() {
    const downloadDir = 'fonts';
    if (
        !fs.existsSync(downloadDir) ||
        (
            fs.existsSync(downloadDir) &&
            !fs.lstatSync(downloadDir).isDirectory()
        )
    ) {
        fs.mkdirSync(downloadDir);
    }
    return new Promise((resolve) => {
        const cliProcess = childProcess.spawn('node', ['bin/font-squirrel-downloader', '--dir', downloadDir]);

        setTimeout(function(){
            cliProcess.kill('SIGTERM');
        }, 10000);

        cliProcess.on('close', () => {
            const files = fs.readdirSync(downloadDir);
            if (files.some(file => /.+-fontfacekit\.zip/.test(file))) {
                resolve();
            } else {
                process.exit(1)
            }
        });
    });
}