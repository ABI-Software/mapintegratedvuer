import readXlsxFile from 'read-excel-file'

// Configuration: Where are your files hosted?
// Example: A folder in a public GitHub repo
const BASE_URL = 'https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/mappings/';
const INDEX_FILE = 'mapping_index.json';

export class MappingService {
  
  // 1. Find the correct Excel file for the current Flatmap
  static async getMappingForFlatmap(flatmapUUID) {
    try {
      // Fetch the master index
      const response = await fetch(`${BASE_URL}${INDEX_FILE}`);
      if (!response.ok) throw new Error('Failed to fetch index');
      
      const index = await response.json();
      
      // Look for the entry (Assuming structure: { "uuid": "filename.xlsx" })
      const filename = index[flatmapUUID];
      
      return filename || null;
    } catch (e) {
      console.error('Error finding map mapping:', e);
      return null;
    }
  }

  // 2. Fetch and Parse the Excel file
  static async loadMapping(filename) {
    try {
      const response = await fetch(`${BASE_URL}${filename}`);
      if (!response.ok) throw new Error(`Failed to fetch ${filename}`);

      // Get the binary data
      const blob = await response.blob();

      // Parse with read-excel-file
      // rows is an array of arrays: [ ["Header1", "Header2"], ["Row1Col1", "Row1Col2"] ]
      const rows = await readXlsxFile(blob);

      // Remove header row
      const headers = rows.shift(); 
      
      // Convert to a Lookup Map for fast access
      // Assuming Column 0 = FlatmapID, Column 1 = Component, Column 2 = Variable
      const lookup = new Map();

      rows.forEach(row => {
        const flatmapId = row[0];   // e.g. "v_123"
        const component = row[1];   // e.g. "left_ventricle"
        const variable = row[2];    // e.g. "pressure"

        if (flatmapId) {
          lookup.set(flatmapId, { component, variable });
        }
      });

      return lookup;
    } catch (e) {
      console.error('Error parsing mapping file:', e);
      return new Map(); // Return empty map on failure to prevent crashes
    }
  }
}
