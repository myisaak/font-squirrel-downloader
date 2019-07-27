const https = require('https')
const readline = require('readline')
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')

const {options, optionkeys} = require('./utils/process-argv')
const API_ENDPOINT = 'https://www.fontsquirrel.com/api/fontlist/all'
const FONTFACEKIT_DOWNLOAD = 'https://www.fontsquirrel.com/fontfacekit/'

console.log(pkg.name + ' ' + pkg.version)

let stream;

let downloadDirectory = './'
if (optionkeys.includes('--dir')) {
  const resolvedPath = path.resolve(options['--dir'])
  if (
    fs.existsSync(resolvedPath) &&
    fs.lstatSync(resolvedPath).isDirectory()
  ) {
    downloadDirectory = resolvedPath
  }
}

getData()

function getData(){
  https.get(API_ENDPOINT, (resp) => {
    let data = ''

    resp.on('data', (chunk) => {
      data += chunk
    })

    resp.on('end', () => {
      const fonts = JSON.parse(data)
      if(typeof fonts === 'object' && fonts.length > 0){
        processFonts(fonts)
      }
    })

  }).on('error', (err) => {
    console.log('Error: ' + err.message)
  })
}

async function processFonts(fonts){
  const fontfacekits_count = fonts.length
  for(let i = 0; i < fontfacekits_count; i++) {
    const fontfacekit = fonts[i]
    const fontfacekits_count_current = i + 1
    const alreadyDownloaded = await checkForDownloadedFontfacekit(fontfacekit.family_urlname)
    if(!alreadyDownloaded) {
      try {
        await downloadFontfacekit(fontfacekit.family_urlname, fontfacekits_count_current, fontfacekits_count)
      } catch (error) {
        console.log('')
        console.log('Error: ' + error.message)
      }
    }
  }
  console.log('')
  console.log('Done.')
}

function checkForDownloadedFontfacekit(fontname){
  return new Promise((resolve) => {
    const options = {method: 'HEAD', host: 'www.fontsquirrel.com', port: 443, path: '/fontfacekit/' + fontname};
    const filePath = fontname + '-fontfacekit.zip'
    const req = https.request(options, function(res) {
      const contentLength = parseInt(res.headers['content-length'], 10)
      if(fs.existsSync(filePath)) {
        const fileStats = fs.statSync(filePath)
        if (fileStats.size === contentLength) {
          resolve(true)
        }
      }
      resolve(false)
    });
    req.end();
  })
}

function downloadFontfacekit(fontname, fontfacekits_count_current, fontfacekits_count){
  return new Promise((resolve, reject) => {
    https.get(FONTFACEKIT_DOWNLOAD + fontname, (resp) => {

      let cur = 0

      const len = parseInt(resp.headers['content-length'], 10)
      const fontfacekit_filename = fontname+'-fontfacekit.zip'
      const file = fs.createWriteStream(path.join(downloadDirectory, fontfacekit_filename))
      stream = file

      resp.on('data', (chunk) => {
        cur += chunk.length
        file.write(chunk)
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        process.stdout.write('Downloading fontfacekit ' + fontfacekits_count_current + ' of ' + fontfacekits_count + ' ' + parseInt((100.0 * cur / len)) + '% ')
      })

      resp.on('end', () => {
        stream = null
        file.close()
        resolve()
      })
  }).on('error', (err) => {
      reject(err)
    })
  })
}

function tearDown() {
  if(stream && !stream.closed) {
    stream.close()
  }
  process.exit(0)
}

process.on('SIGINT', function(){
  tearDown()
})

process.on('SIGTERM', function(){
  tearDown()
})