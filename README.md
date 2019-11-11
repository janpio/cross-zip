# cross-zip

[![Build status](https://travis-ci.com/toyobayashi/cross-zip.svg?branch=master)](https://travis-ci.com/toyobayashi/cross-zip/)

Fork from [https://github.com/feross/cross-zip](https://github.com/feross/cross-zip)

Cross-platform .zip file creation

## Install

```
npm install @tybys/cross-zip
```

## Usage

### JavaScript

``` js
const path = require('path')
const crossZip = require('@tybys/cross-zip')

const input = path.join(__dirname, 'myFolder') // folder to zip
const output = path.join(__dirname, 'myFile.zip') // name of output zip file

crossZip.zipSync(input, output)
```

### TypeScript

``` ts
import * as path from 'path'
import * as crossZip from '@tybys/cross-zip'

const input = path.join(__dirname, 'myFolder') // folder to zip
const output = path.join(__dirname, 'myFile.zip') // name of output zip file

crossZip.zipSync(input, output)
```

## API

### `crossZip.zip(input, output [, includeBaseDirectory])`

Zip the folder or file at `input` and save it to a .zip file at `output`. 

`includeBaseDirectory`: `true` to include the directory name from `input` at the root of the archive; `false` to include only the contents of the directory.

Return `Promise<number>` (size of archive).

### `crossZip.zipSync(input, output [, includeBaseDirectory])`

Sync version of `crossZip.zip`.

### `crossZip.unzip(input, output)`

Unzip the .zip file at `input` into the folder at `output`. Return `Promise<void>`.

### `crossZip.unzipSync(input, output)`

Sync version of `crossZip.unzip`.

## Windows users

This package requires [.NET Framework 4.5 or later](https://www.microsoft.com/net)
and [Powershell 3](https://www.microsoft.com/en-us/download/details.aspx?id=34595).
These come **pre-installed** on Windows 8 or later.

On Windows 7 or earlier, you will need to install these manually in order for
`cross-zip` to function correctly.

## Reference

- [Stack Overflow - zipping from command line in Windows](https://stackoverflow.com/questions/17546016/how-can-you-zip-or-unzip-from-the-command-prompt-using-only-windows-built-in-ca)

## License

MIT.
