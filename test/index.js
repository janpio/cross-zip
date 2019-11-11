const path = require('path')
const fs = require('fs-extra')
const assert = require('assert')
const crossZip = require('..')

const testTmpDir = path.join(__dirname, 'tmp')

describe('Zip', function () {
  it('Zip dir without base dir', async function () {
    this.timeout(Infinity)
    const archive = path.join(testTmpDir, `without-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = await crossZip.zip(path.join(__dirname, 'content'), archive)
    assert.ok(typeof size === 'number', `zip() should return Promise<number> but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    await crossZip.unzip(archive, unzipDir)
    assert.ok(fs.existsSync(unzipDir), 'Unzip failed')
    assert.ok(!fs.existsSync(path.join(unzipDir, 'content')), 'Base dir exists')
  })

  it('Zip dir with base dir', async function () {
    this.timeout(Infinity)
    const archive = path.join(testTmpDir, `with-base-${process.platform}.zip`)
    const unzipDir = path.join(path.dirname(archive), path.basename(archive, '.zip'))
    const size = await crossZip.zip(path.join(__dirname, 'content'), archive, true)
    assert.ok(typeof size === 'number', `zip() should return Promise<number> but ${typeof size}`)
    assert.ok(fs.existsSync(archive), 'Zip failed')
    await crossZip.unzip(archive, unzipDir)
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
})
