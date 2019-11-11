const cp = require('child_process')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

function getZipDirectoryCommand (sourceDirectoryName, destinationArchiveFileName, includeBaseDirectory) {
  if (process.platform === 'win32') {
    return `powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; Add-Type -A 'System.Text.Encoding'; [IO.Compression.ZipFile]::CreateFromDirectory('${sourceDirectoryName}', '${destinationArchiveFileName}', 1, $${!!includeBaseDirectory}, [System.Text.Encoding]::UTF8); }"`
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
    return `powershell.exe -nologo -noprofile -command "& { Add-Type -A 'System.IO.Compression.FileSystem'; Add-Type -A 'System.Text.Encoding'; [IO.Compression.ZipFile]::ExtractToDirectory('${sourceArchiveFileName}', '${destinationDirectoryName}', [System.Text.Encoding]::UTF8); }"`
  } else {
    return `unzip -o ${JSON.stringify(sourceArchiveFileName)} -d ${JSON.stringify(destinationDirectoryName)}`
  }
}

function ensureDir (dir) {
  if (fs.existsSync(dir)) {
    let stats
    try {
      stats = fs.statSync(dir)
      if (stats.isDirectory()) {
        return true
      } else {
        return false
      }
    } catch (err) {
      return false
    }
  }

  try {
    fs.mkdirsSync(dir)
    return true
  } catch (err) {
    return false
  }
}

function zip (input, output, includeBaseDirectory) {
  return new Promise((resolve, reject) => {
    fs.stat(input, (err, stats) => {
      if (err) { reject(err); return }
      fs.remove(output, (err) => {
        if (err) { reject(err); return }
        if (!ensureDir(path.dirname(output))) { reject(new Error(`"${path.dirname(output)}" is not a directory`)); return }
        if (stats.isDirectory()) {
          const cmd = getZipDirectoryCommand(input, output, includeBaseDirectory)
          cp.exec(cmd, (err) => {
            if (err) { reject(err); return }
            fs.stat(output, (err, stats) => {
              if (err) { reject(err); return }
              resolve(stats.size)
            })
          })
        } else {
          const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
          const target = path.join(tmpPath, path.basename(input))
          fs.mkdir(tmpPath, function (err) {
            if (err) { reject(err); return }
            fs.copyFile(input, target, (err) => {
              if (err) { reject(err); return }
              cp.exec(getZipDirectoryCommand(tmpPath, output, false), { maxBuffer: Infinity }, (err) => {
                fs.remove(tmpPath, (err) => {
                  if (err) { reject(err); return }
                  fs.stat(output, (err, stats) => {
                    if (err) { reject(err); return }
                    resolve(stats.size)
                  })
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
  fs.removeSync(output)
  if (!ensureDir(path.dirname(output))) throw new Error(`"${path.dirname(output)}" is not a directory`)
  if (stats.isDirectory()) {
    cp.execSync(getZipDirectoryCommand(input, output, includeBaseDirectory))
    return
  }
  const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
  const target = path.join(tmpPath, path.basename(input))
  fs.mkdirSync(tmpPath)
  fs.copyFileSync(input, target)
  cp.execSync(getZipDirectoryCommand(input, output, false), { maxBuffer: Infinity })
  fs.removeSync(tmpPath)
  return fs.statSync(output).size
}

function unzip (input, output) {
  return new Promise((resolve, reject) => {
    if (!ensureDir(path.dirname(output))) { reject(new Error(`"${path.dirname(output)}" is not a directory`)); return }
    if (process.platform === 'win32' && fs.existsSync(output)) {
      if (fs.statSync(output).isDirectory()) {
        const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
        cp.exec(getUnzipCommand(input, tmpPath), { maxBuffer: Infinity }, function (err) {
          if (err) { reject(err); return }
          fs.copy(tmpPath, output, (err) => {
            fs.remove(tmpPath, (err) => {
              if (err) { reject(err); return } 
              resolve()
            })
            if (err) reject(err)
          })
        })
      } else {
        reject(new Error(`"${output}" is not a directory.`))
        return
      }
    } else {
      cp.exec(getUnzipCommand(input, output), { maxBuffer: Infinity }, function (err) {
        if (err) { reject(err); return }
        resolve()
      })
    }
  })
}

function unzipSync (input, output) {
  if (!ensureDir(path.dirname(output))) throw new Error(`"${path.dirname(output)}" is not a directory`)
  if (process.platform === 'win32' && fs.existsSync(output)) {
    if (fs.statSync(output).isDirectory()) {
      const tmpPath = path.join(os.tmpdir(), 'cross-zip-' + Date.now())
      cp.execSync(getUnzipCommand(input, tmpPath), { maxBuffer: Infinity })
      fs.copySync(tmpPath, ouput)
      fs.removeSync(tmpPath)
    } else {
      throw new Error(`"${output}" is not a directory.`)
    }
  } else {
    cp.execSync(getUnzipCommand(input, output), { maxBuffer: Infinity })
  }
}

module.exports = {
  zip,
  zipSync,
  unzip,
  unzipSync
}
