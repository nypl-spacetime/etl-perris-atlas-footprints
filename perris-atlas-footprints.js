const fs = require('fs')
const path = require('path')
const request = require('request')
const shapefile = require('shapefile')
const H = require('highland')
const R = require('ramda')
const rewind = require('geojson-rewind')

const S3_URL = 'http://spacetime-nypl-org.s3.amazonaws.com/source-data/perris-atlas-footprints/'
const FILENAMES = [
  'perris.shp',
  'perris.prj',
  'perris.shx',
  'perris.dbf'
]
const SHAPEFILE = 'perris.shp'

const PROPERTIES = [
  'additional',
  'comment',
  ['use_subtyp', 'useSubtype'],
  ['use_type', 'useType'],
  ['layer_id', 'layerId'],
  'class',
  ['roof_type', 'roofType'],
  'materials',
  'skylights',
  'stores',
  'boilers',
  ['buildings_', 'buildings']
]

const BOOLEANS = [
  'stores',
  'boilers',
  'buildings'
]

const pickProperties = PROPERTIES.map((property) => Array.isArray(property) ? property[0] : property)
const newProperties = R.fromPairs(PROPERTIES.map((property) => Array.isArray(property) ? property : [property, property]))

// Building [1] -> [n] Address [1] -> [1] Street

function writeFeature (writer, feature, callback) {
  var properties = R.fromPairs(R.toPairs(R.pick(pickProperties, feature.properties))
    .filter((pair) => pair[1])
    .map((pair) => [newProperties[pair[0]], pair[1]]))

  BOOLEANS.forEach((boolean) => properties[boolean] === properties[boolean])

  const year = parseInt(feature.properties.layer_year)

  var address
  if (feature.properties.street) {
    address = {
      address: {
        street: feature.properties.street
      }
    }

    if (feature.properties.number) {
      address.address.number = feature.properties.number
    }
  }

  var secondaryAddress
  if (feature.properties.secondar_1) {
    secondaryAddress = {
      secondaryAddress: {
        street: feature.properties.secondar_1
      }
    }

    if (feature.properties.secondar_2) {
      secondaryAddress.secondaryAddress.number = feature.properties.secondar_2
    }
  }

  var building = {
    type: 'object',
    obj: {
      id: feature.properties.id,
      type: 'st:Building',
      validSince: year,
      validUntil: year,
      data: Object.assign(properties, address, secondaryAddress),
      geometry: rewind(feature.geometry, false)
    }
  }

  if (feature.properties.name) {
    building.obj.name = feature.properties.name
  }

  writer.writeObject(building, callback)
}

function downloadFile (dir, filename, callback) {
  request(S3_URL + filename)
    .pipe(fs.createWriteStream(path.join(dir, filename)))
    .on('error', callback)
    .on('finish', callback)
}

function download (config, dirs, tools, callback) {
  H(FILENAMES)
    .map(H.curry(downloadFile, dirs.current))
    .nfcall([])
    .series()
    .errors(callback)
    .done(callback)
}

function transform (config, dirs, tools, callback) {
  shapefile.open(path.join(dirs.download, SHAPEFILE))
    .then(source => source.read()
      .then(function log (result) {
        if (result.done) {
          callback()
          return
        }

        writeFeature(tools.writer, result.value, (err) => {
          if (err) {
            callback(err)
          } else {
            return source.read().then(log)
          }
        })
      }))
    .catch(callback)
}

// ==================================== API ====================================

module.exports.steps = [
  download,
  transform
]
