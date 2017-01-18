# Space/Time ETL module: Perris Atlas Footprints

[ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load) module for NYPL's [NYC Space/Time Direcory](http://spacetime.nypl.org/). This Node.js module downloads, parses, and/or transforms Perris Atlas Footprints data to a NYC Space/Time Directory dataset.

## Details

<table>
  <tbody>

    <tr>
      <td>ID</td>
      <td><code>perris-atlas-footprints</code></td>
    </tr>

    <tr>
      <td>Title</td>
      <td>Perris Atlas Footprints</td>
    </tr>

    <tr>
      <td>Description</td>
      <td>Building footprints from William Perris' 1854 Maps of the City of New York, traced by NYPL librarians</td>
    </tr>

    <tr>
      <td>License</td>
      <td>CC0</td>
    </tr>

    <tr>
      <td>Author</td>
      <td>NYPL</td>
    </tr>

    <tr>
      <td>Website</td>
      <td><a href="https://digitalcollections.nypl.org/items/510d47e0-bfdd-a3d9-e040-e00a18064a99">https://digitalcollections.nypl.org/items/510d47e0-bfdd-a3d9-e040-e00a18064a99</a></td>
    </tr>
  </tbody>
</table>

## Available steps

  - `transform`

## Usage

```
git clone https://github.com/nypl-spacetime/etl-perris-atlas-footprints.git /path/to/etl-modules
cd /path/to/etl-modules/etl-perris-atlas-footprints
npm install

spacetime-etl perris-atlas-footprints [<step>]
```

See http://github.com/nypl-spacetime/spacetime-etl for information about Space/Time's ETL tool. More Space/Time ETL modules [can be found on GitHub](https://github.com/search?utf8=%E2%9C%93&q=org%3Anypl-spacetime+etl-&type=Repositories&ref=advsearch&l=&l=).

# Data

The dataset created by this ETL module's `transform` step can be found in the [data section of the NYC Space/Time Directory website](http://spacetime.nypl.org/#data-perris-atlas-footprints).
