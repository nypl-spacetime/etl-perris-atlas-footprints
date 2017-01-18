const path = require('path')
const shapefile = require('shapefile')
const R = require('ramda')

// Shapefile data:
//   Copy files from s3://spacetime-nypl-org/source-data/perris-atlas-footprints/
//   to ./data

const FILENAME = 'data/perris.shp'

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
      geometry: feature.geometry
    }
  }

  if (feature.properties.name) {
    building.obj.name = feature.properties.name
  }

  writer.writeObject(building, callback)
}

function transform (config, dirs, tools, callback) {
  shapefile.open(path.join(__dirname, FILENAME))
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
  transform
]
