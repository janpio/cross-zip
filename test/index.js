const path = require('path')
const fs = require('fs-extra')
const assert = require('assert')
const crossZip = require('..')

const testTmpDir = path.join(__dirname, 'tmp')

describe('Zip', function () {
  it('Zip a dir without base dir', async function () {
    this.timeout(Infinity)
    const archive = path.join(testTmpDir, `without-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = await crossZip.zip(path.join(__dirname, 'content'), archive)
    assert.ok(typeof size === 'number', `zip() should return Promise<number> but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    await crossZip.unzip(archive, unzipDir)
    fs.readdirSync(path.join(unzipDir)).forEach(file => {
      console.log(file)
    })

    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(!fs.existsSync(path.join(unzipDir, 'content')), 'Base dir exists')
  })

  it('Zip a dir with base dir', async function () {
    this.timeout(Infinity)
    const archive = path.join(testTmpDir, `with-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = await crossZip.zip(path.join(__dirname, 'content'), archive, true)
    assert.ok(typeof size === 'number', `zip() should return Promise<number> but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    await crossZip.unzip(archive, unzipDir)
    fs.readdirSync(path.join(unzipDir)).forEach(file => {
      console.log(file)
    })

    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content')), 'Base dir not exists')
  })

  it('Zip a file', async function () {
    this.timeout(Infinity)
    const archive = path.join(testTmpDir, `file-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = await crossZip.zip(path.join(__dirname, 'content/file.txt'), archive)
    assert.ok(typeof size === 'number', `zip() should return Promise<number> but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    await crossZip.unzip(archive, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'file.txt')), 'file not exists')
  })

  it('Zip a dir without base dir (sync)', function () {
    const archive = path.join(testTmpDir, `sync-without-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = crossZip.zipSync(path.join(__dirname, 'content'), archive)
    assert.ok(typeof size === 'number', `zipSync() should return number but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    crossZip.unzipSync(archive, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(!fs.existsSync(path.join(unzipDir, 'content')), 'Base dir exists')
  })

  it('Zip a dir with base dir (sync)', function () {
    const archive = path.join(testTmpDir, `sync-with-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = crossZip.zipSync(path.join(__dirname, 'content'), archive, true)
    assert.ok(typeof size === 'number', `zipSync() should return number but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    crossZip.unzipSync(archive, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content')), 'Base dir not exists')
  })

  it('Zip a file (sync)', function () {
    const archive = path.join(testTmpDir, `sync-file-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = crossZip.zipSync(path.join(__dirname, 'content/file.txt'), archive)
    assert.ok(typeof size === 'number', `zipSync() should return number but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    crossZip.unzipSync(archive, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'file.txt')), 'file not exists')
  })
})

describe('Unzip', function () {
  it('space path', async function () {
    this.timeout(Infinity)
    const archive2 = path.join(testTmpDir, `with-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive2), 'unzip space')

    await crossZip.unzip(archive2, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/subdir')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/file.txt')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/subdir/子目录文件.txt')), 'unzip')
  })

  it('ps error', function (done) {
    this.timeout(Infinity)
    crossZip.unzip('error', 'error').then(() => {
      done(new Error('Should throw'))
    }).catch(() => {
      done()
    })
  })

  it('Overwrite', async function () {
    this.timeout(Infinity)
    const archive1 = path.join(testTmpDir, `without-base-${process.platform}.zip`)
    const archive2 = path.join(testTmpDir, `with-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive1), 'overwrite')

    await crossZip.unzip(archive1, unzipDir)
    await crossZip.unzip(archive2, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/subdir')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/file.txt')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'content/subdir/子目录文件.txt')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'subdir')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'file.txt')), 'unzip')
    assert.ok(fs.existsSync(path.join(unzipDir, 'subdir/子目录文件.txt')), 'unzip')
  })
})
