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

function makeAddressObject(buildingId, type, year, address) {
  if (address) {
    const addressId = `${buildingId}-${type}`

    const addressName = (address) => {
      let name = address.street
      if (address.number) {
        name = `${address.number} ${name}`
      }
      return name
    }

    return [
      {
        type: 'object',
        obj: {
          id: addressId,
          type: 'st:Address',
          name: addressName(address),
          validSince: year,
          validUntil: year,
          data: Object.assign(address, {
            addressType: type
          })
        }
      },
      {
        type: 'relation',
        obj: {
          from: addressId,
          to: buildingId,
          type: 'st:in'
        }
      }
    ]
  }
}

function writeFeature (writer, feature, callback) {
  const properties = R.fromPairs(R.toPairs(R.pick(pickProperties, feature.properties))
    .filter((pair) => pair[1])
    .map((pair) => [newProperties[pair[0]], pair[1]]))

  BOOLEANS.forEach((boolean) => properties[boolean] === properties[boolean])

  const buildingId = feature.properties.id
  const year = parseInt(feature.properties.layer_year)

  let address
  if (feature.properties.street) {
    address = {
      street: feature.properties.street,
      number: feature.properties.number
    }

    if (feature.properties.number) {
      address.number = feature.properties.number
    }
  }

  let secondaryAddress
  if (feature.properties.secondar_1) {
    secondaryAddress = {
      street: feature.properties.secondar_1
    }

    if (feature.properties.secondar_2) {
      secondaryAddress.number = feature.properties.secondar_2
    }
  }

  const building = {
    type: 'object',
    obj: {
      id: buildingId,
      type: 'st:Building',
      name: feature.properties.name || undefined,
      validSince: year,
      validUntil: year,
      data: Object.assign(properties, {address}, {secondaryAddress}),
      geometry: rewind(feature.geometry, false)
    }
  }

  const addresses = [
    makeAddressObject(buildingId, 'primary', year, address),
    makeAddressObject(buildingId, 'secondary', year, secondaryAddress)
  ]

  writer.writeObjects(R.flatten([building, addresses]), callback)
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
