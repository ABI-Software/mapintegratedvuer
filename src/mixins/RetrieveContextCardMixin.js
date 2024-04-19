
/* eslint-disable no-alert, no-console */
export default {
  // Note that the setting store is included in MapContent.vue
  methods: {
    retrieveContextCardFromUrl: async function (url) {
      // split the url to get the datasetId
      const [datasetId, basePath, scaffoldPath, s3uri] = this.splitInfoFromUrl(url);

      // get the context file from scicrunch
      const sciResults = await this.getContextFileFromScicrunch(datasetId, scaffoldPath);
      if (!sciResults.success){
        return {} // return empty object if no context file is found (the empty object will be added to the entry)
      }

      // return the context file
      const fullPath = basePath + sciResults.contextFile + s3uri;
      return {
        s3uri: sciResults.s3uri,
        contextCardUrl: fullPath,
      }
    },
    splitInfoFromUrl: function (url) {
      // example url: "https://mapcore-demo.org/current/sparc-api-v2/s3-resource/221/3/files/derivative/Scaffolds/mouse_colon_metadata.json",
      // find the part after 's3-resource' 
      let s3path = url.split('s3-resource')[1];
      let basePath = url.split('files/')[0] + 'files/' // This gives us the base path for our relative path we will get from scicrunch
      let scaffoldPath = url.split('files/')[1].split('?')[0] // This gives us the relative path to the file we want to get from scicrunch
      let s3uri = '?' + url.split('?')[1] // This gives us the uri needed to get the file from s3

      // split the url by '/'
      const parts = s3path.split('/');
      // remove the first part
      parts.shift();
      // return the datasetId which is the first part
      const datasetId = parts[0];

      return [datasetId, basePath, scaffoldPath, s3uri];
    },
    getContextFileFromScicrunch: async function (datasetId, scaffoldPath) {
      // get the context file from scicrunch
      let results = await fetch(`${this.settingsStore.sparcApi}/dataset_info/using_multiple_discoverIds/?discoverIds=${datasetId}`)
        .then(response => response.json())
        .then(data => {
          // get the context info from the response
          if (data.numberOfHits === 1) { // check if there is only one hit (We don't want to use the data if there are multiple hits)
            const contextFile = data.results[0]['abi-contextual-information']

            // check if there is only one context file and if so return it
            if ( contextFile && contextFile.length === 1) {
              return {
                success: true,
                contextFile: contextFile[0], 
                s3uri: data.results[0]['s3uri']
              }
            }

            // If there are multiple context files, find the one that matches the scaffold path
            else if (contextFile && contextFile.length > 1) {
              let search = this.findContextInforForFilePath(data.results[0]['abi-context-file'], scaffoldPath);
              if (search) {
                return {
                  success: true,
                  contextFile: search, 
                  s3uri: data.results[0]['s3uri']
                }
              }
            }
          }
          return {success: false};
        }).catch(error => {
          console.error('Error:', error);
          return {success: false};
        });
      return results;
    },
    findContextInforForFilePath: function (dataciteInfo, filePath) {
      // find the context file that matches the scaffold path
      let result = dataciteInfo.find((info) => info.datacite.isDerivedFrom.path.includes(filePath))
      return result?.dataset?.path
    }
  }
}
