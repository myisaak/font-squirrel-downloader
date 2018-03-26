const https = require('https')
const readline = require('readline')
const fs = require('fs')
const pkg = require('./package.json')
const API_ENDPOINT = 'https://www.fontsquirrel.com/api/fontlist/all'
const FONTFACEKIT_DOWNLOAD = 'https://www.fontsquirrel.com/fontfacekit/'

console.log(pkg.name.split('-').map(item => capitalizeFirstLetter(item)).join('') + " " + pkg.version)

getData()

// capitalizeFirstLetter by https://stackoverflow.com/users/48492/steve-harrison
// @link https://stackoverflow.com/a/1026087/753676
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

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
  for(i = 0; i < fontfacekits_count; i++) {
    const fontfacekit = fonts[i]
    const fontfacekits_count_current = i + 1
    await downloadFontfacekit(fontfacekit.family_urlname, fontfacekits_count_current, fontfacekits_count)
  }
  console.log('')
  console.log('Done.')
}

function downloadFontfacekit(fontname, fontfacekits_count_current, fontfacekits_count){
  return new Promise((resolve, reject) => {
    https.get(FONTFACEKIT_DOWNLOAD + fontname, (resp) => {

      let data = ''
      let cur = 0

      const len = parseInt(resp.headers['content-length'], 10)
      const fontfacekit_filename = fontname+'-fontfacekit.zip'
      const file = fs.createWriteStream('./' + fontfacekit_filename)

      resp.on('data', (chunk) => {
        cur += chunk.length
        file.write(chunk)
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        process.stdout.write('Downloading fontfacekit ' + fontfacekits_count_current + ' of ' + fontfacekits_count + ' ' + parseInt((100.0 * cur / len)) + '% ')
      });

      resp.on('end', () => {
        resolve()
      })

  }).on('error', (err) => {
      console.log('')
      console.log('Error: ' + err.message)
      reject(err)
    })
  })
}
