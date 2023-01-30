const fs = require('fs')

const saveInfo = (info) => {
  const data = JSON.stringify(info)
  try {
    fs.writeFileSync('info.dat', data)
  }
  catch (err) {
    console.log(`Error saving info file: ${err}`)
  }
}

const readInfo = () => {
  try {
    const data = fs.readFileSync('info.dat', 'utf-8')
    const info = JSON.parse(data)
    return info
  }
  catch (err) {
    console.log(`Error reading info file: ${err}`)
  }
}

module.exports = { saveInfo, readInfo };