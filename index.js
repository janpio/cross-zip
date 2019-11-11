const cp = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')

function getZipDirectoryCommand (sourceDirectoryName, destinationArchiveFileName, includeBaseDirectory) {
  if (process.platform === 'win32') {
    return `powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; Add-Type -A 'System.Text.Encoding'; [IO.Compression.ZipFile]::CreateFromDirectory('${sourceDirectoryName}', '${destinationArchiveFileName}', 1, ${!!includeBaseDirectory}, [System.Text.Encoding]::UTF8); }"`
  } else {
    if (includeBaseDirectory) {
      const dir = path.dirname(sourceDirectoryName)
      const base = path.basename(sourceDirectoryName)
      return `cd ${JSON.stringify(dir)} && zip -r -y ${JSON.stringify(destinationArchiveFileName)} ${JSON.stringify(base)}`
    }
    return `cd ${JSON.stringify(sourceDirectoryName)} && zip -r -y ${JSON.stringify(destinationArchiveFileName)} ${JSON.stringify('.')}`
  }
}

function getUnzipCommand (sourceArchiveFileName, destinationDirectoryName) {
  if (process.platform === 'win32') {
    return `powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; Add-Type -A 'System.Text.Encoding'; [IO.Compression.ZipFile]::ExtractToDirectory('${sourceArchiveFileName}', '${destinationDirectoryName}', [System.Text.Encoding]::UTF8, true); }"`
  } else {
    return `unzip -o ${JSON.stringify(sourceArchiveFileName)} -d ${JSON.stringify(destinationDirectoryName)}`
  }
}

function zip (input, output, includeBaseDirectory) {
  return new Promise((resolve, reject) => {
    fs.stat(input, (err, stats) => {
      if (err) { reject(err); return }
      rimraf(output, (err) => {
        if (err) { reject(err); return }
        if (stats.isDirectory()) {
          cp.exec(getZipDirectoryCommand(input, output, includeBaseDirectory), (err) => {
            if (err) { reject(err); return }
            resolve()
          })
        } else {
          const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
          const target = path.join(tmpPath, path.basename(input))
          fs.mkdir(tmpPath, function (err) {
            if (err) { reject(err); return }
            fs.copyFile(input, target, (err) => {
              if (err) { reject(err); return }
              cp.exec(getZipDirectoryCommand(tmpPath, output, false), { maxBuffer: Infinity }, (err) => {
                rimraf(tmpPath, (err) => {
                  if (err) { reject(err); return }
                  resolve()
                })
                if (err) reject(err)
              })
            })
          })
        }
      })
    })
  })
}

function zipSync (input, output, includeBaseDirectory) {
  const stats = fs.statSync(input)
  rimraf.sync(output)
  if (stats.isDirectory()) {
    cp.execSync(getZipDirectoryCommand(input, output, includeBaseDirectory))
    return
  }
  const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
  const target = path.join(tmpPath, path.basename(input))
  fs.mkdirSync(tmpPath)
  fs.copyFileSync(input, target)
  cp.execSync(getZipDirectoryCommand(input, output, false), { maxBuffer: Infinity })
  rimraf.sync(tmpPath)
}

function unzip (input, output) {
  return new Promise((resolve, reject) => {
    cp.exec(getUnzipCommand(input, output), { maxBuffer: Infinity }, function (err) {
      if (err) { reject(err); return }
      resolve()
    })
  })
}

function unzipSync (input, output) {
  cp.execSync(getUnzipCommand(input, output), { maxBuffer: Infinity })
}

module.exports = {
  zip,
  zipSync,
  unzip,
  unzipSync
}
