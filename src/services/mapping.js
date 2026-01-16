import readXlsxFile from 'read-excel-file'

const BASE_URL =
  'https://raw.githubusercontent.com/hsorby/fc-feature-mapping/main/'
const INDEX_FILE = 'mapping_index.json'

export class MappingService {
  // Find the correct Excel file for the current Flatmap
  static async getMappingIndex() {
    try {
      // Fetch the master index
      const response = await fetch(`${BASE_URL}${INDEX_FILE}`)
      if (!response.ok) throw new Error('Failed to fetch index')

      const index = await response.json()

      return index || null
    } catch (e) {
      console.error('Error finding map mapping:', e)
      return null
    }
  }

  // Fetch and Parse the Excel file
  static async loadMapping(index) {
    const flatmapMap = new Map()

    for (const entry in index) {
      try {
        const filename = index[entry]
        console.log(entry, filename)

        const response = await fetch(`${BASE_URL}${filename}`)
        if (!response.ok) throw new Error(`Failed to fetch ${filename}`)

        // Get the binary data
        const blob = await response.blob()

        // Parse with read-excel-file
        // rows is an array of arrays: [ ["Header1", "Header2"], ["Row1Col1", "Row1Col2"] ]
        const rows = await readXlsxFile(blob)

        // Remove header row
        const headers = rows.shift()
        const nameIndex = headers.indexOf('Name')
        const componentIndex = headers.indexOf('Component')
        const flatmapIdIndex = headers.indexOf('Flatmap ID')

        // Convert to a Lookup Map for fast access
        // Assuming Column 0 = FlatmapID, Column 1 = Component, Column 2 = Variable
        const lookup = new Map()

        rows.forEach((row) => {
          const flatmapId = row[flatmapIdIndex]
          const component = row[componentIndex]
          const variable = row[nameIndex]

          if (flatmapId && component && variable) {
            lookup.set(flatmapId, { component, variable })
          }
        })
        flatmapMap.set(entry, lookup)
      } catch (e) {
        console.error('Error parsing mapping file:', e)
      }
    }

    return flatmapMap
  }
}
