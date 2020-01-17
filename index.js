const cp = require('child_process')
const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const ObjectId = require('@tybys/oid')

const execOptions = {
  maxBuffer: Infinity
}

function getTempDirName () {
  return 'cross-zip-' + new ObjectId().toHexString()
}

function getZipCommand () {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  } else {
    return 'zip'
  }
}

function getUnzipCommand () {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  } else {
    return 'unzip'
  }
}

function getZipDirectoryArgs (sourceDirectoryName, destinationArchiveFileName, includeBaseDirectory) {
  if (process.platform === 'win32') {
    return {
      args: [
        '-nologo',
        '-noprofile',
        '-command', "& { " +
          "param([String]$sourceDirectoryName, [String]$destinationArchiveFileName, [Boolean]$includeBaseDirectory); " +
          "Add-Type -A 'System.IO.Compression.FileSystem'; " +
          "Add-Type -A 'System.Text.Encoding'; " +
          "[IO.Compression.ZipFile]::CreateFromDirectory($sourceDirectoryName, $destinationArchiveFileName, [IO.Compression.CompressionLevel]::Fastest, $includeBaseDirectory, [System.Text.Encoding]::UTF8); " +
        "}",
        '-sourceDirectoryName', sourceDirectoryName,
        '-destinationArchiveFileName', destinationArchiveFileName,
        '-includeBaseDirectory', `$${!!includeBaseDirectory}`
      ],
      cwd: process.cwd()
    }
  } else {
    if (includeBaseDirectory) {
      const dir = path.dirname(sourceDirectoryName)
      const base = path.basename(sourceDirectoryName)
      return {
        args: [
          '-r',
          '-y',
          destinationArchiveFileName,
          base
        ],
        cwd: dir
      }
    }
    return {
      args: [
        '-r',
        '-y',
        destinationArchiveFileName,
        '.'
      ],
      cwd: sourceDirectoryName
    }
  }
}

function getUnzipArgs (sourceArchiveFileName, destinationDirectoryName) {
  if (process.platform === 'win32') {
    return {
      args: [
        '-nologo',
        '-noprofile',
        '-command', "& { " +
          "param([String]$sourceArchiveFileName, [String]$destinationDirectoryName); " +
          "Add-Type -A 'System.IO.Compression.FileSystem'; " +
          "Add-Type -A 'System.Text.Encoding'; " +
          "[IO.Compression.ZipFile]::ExtractToDirectory($sourceArchiveFileName, $destinationDirectoryName, [System.Text.Encoding]::UTF8); " +
        "}",
        '-sourceArchiveFileName', sourceArchiveFileName,
        '-destinationDirectoryName', destinationDirectoryName
      ],
      cwd: process.cwd()
    }
  } else {
    return {
      args: [
        '-o',
        sourceArchiveFileName,
        '-d',
        destinationDirectoryName
      ],
      cwd: process.cwd()
    }
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
          const { args, cwd } = getZipDirectoryArgs(input, output, includeBaseDirectory)
          cp.execFile(getZipCommand(), args, { ...execOptions, cwd }, (err) => {
            if (err) { reject(err); return }
            fs.stat(output, (err, stats) => {
              if (err) { reject(err); return }
              resolve(stats.size)
            })
          }).on('error', reject)
        } else {
          const tmpPath = path.join(os.tmpdir(), getTempDirName())
          const target = path.join(tmpPath, path.basename(input))
          fs.mkdirs(tmpPath, function (err) {
            if (err) { reject(err); return }
            fs.copy(input, target, (err) => {
              if (err) { reject(err); return }
              const { args, cwd } = getZipDirectoryArgs(tmpPath, output, false)
              cp.execFile(getZipCommand(), args, { ...execOptions, cwd }, (err) => {
                fs.remove(tmpPath, (err) => {
                  if (err) { reject(err); return }
                  fs.stat(output, (err, stats) => {
                    if (err) { reject(err); return }
                    resolve(stats.size)
                  })
                })
                if (err) reject(err)
              }).on('error', reject)
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
    const { args, cwd } = getZipDirectoryArgs(input, output, includeBaseDirectory)
    cp.execFileSync(getZipCommand(), args, { ...execOptions, cwd })
    return fs.statSync(output).size
  }
  const tmpPath = path.join(os.tmpdir(), getTempDirName())
  const target = path.join(tmpPath, path.basename(input))
  fs.mkdirsSync(tmpPath)
  fs.copySync(input, target)
  const size = zipSync(tmpPath, output, false)
  fs.removeSync(tmpPath)
  return size
}

function unzip (input, output) {
  return new Promise((resolve, reject) => {
    if (!ensureDir(path.dirname(output))) { reject(new Error(`"${path.dirname(output)}" is not a directory`)); return }
    if (process.platform === 'win32' && fs.existsSync(output)) {
      if (fs.statSync(output).isDirectory()) {
        const tmpPath = path.join(os.tmpdir(), getTempDirName())
        const { args, cwd } = getUnzipArgs(input, tmpPath)
        cp.execFile(getUnzipCommand(), args, { ...execOptions, cwd }, function (err) {
          if (err) { reject(err); return }
          fs.copy(tmpPath, output, (err) => {
            fs.remove(tmpPath, (err) => {
              if (err) { reject(err); return } 
              resolve()
            })
            if (err) reject(err)
          })
        }).on('error', reject)
      } else {
        reject(new Error(`"${output}" is not a directory.`))
        return
      }
    } else {
      const { args, cwd } = getUnzipArgs(input, output)
      cp.execFile(getUnzipCommand(), args, { ...execOptions, cwd }, function (err) {
        if (err) { reject(err); return }
        resolve()
      }).on('error', reject)
    }
  })
}

function unzipSync (input, output) {
  if (!ensureDir(path.dirname(output))) throw new Error(`"${path.dirname(output)}" is not a directory`)
  if (process.platform === 'win32' && fs.existsSync(output)) {
    if (fs.statSync(output).isDirectory()) {
      const tmpPath = path.join(os.tmpdir(), getTempDirName())
      const { args, cwd } = getUnzipArgs(input, tmpPath)
      cp.execFileSync(getUnzipCommand(), args, { ...execOptions, cwd })
      fs.copySync(tmpPath, output)
      fs.removeSync(tmpPath)
    } else {
      throw new Error(`"${output}" is not a directory.`)
    }
  } else {
    const { args, cwd } = getUnzipArgs(input, output)
    cp.execFileSync(getUnzipCommand(), args, { ...execOptions, cwd })
  }
}

module.exports = {
  zip,
  zipSync,
  unzip,
  unzipSync
}
