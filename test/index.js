const path = require('path')
const fs = require('fs-extra')
const crossZip = require('..')

const testTmpDir = path.join(__dirname, 'tmp')

describe('Zip', function () {
  it('Zip dir without base dir', async function () {
    this.timeout(Infinity)
    await crossZip.zip(path.join(__dirname, 'content'), path.join(testTmpDir, `without-base-${process.platform}.zip`))
  })

  it('Zip dir with base dir', async function () {
    this.timeout(Infinity)
    await crossZip.zip(path.join(__dirname, 'content'), path.join(testTmpDir, `with-base-${process.platform}.zip`), true)
  })
})
