
/* eslint-disable no-alert, no-console */
export default {
  // Note that the setting store is included in MapContent.vue
  methods: {
    retrieveContextCardFromUrl: async function (url) {
      console.log('retrieveContextCardFromUrl', url);
      // split the url to get the datasetId
      const [datasetId, basePath] = this.splitInfoFromUrl(url);

      console.log('datasetId', datasetId);
      // get the context file from scicrunch
      const sciResults = await this.getContextFileFromScicrunch(datasetId);
      if (!sciResults.success){
        return {} // return empty object if no context file is found (the empty object will be added to the entry)
      }

      // return the context file
      const fullPath = basePath + sciResults.contextFile;
      console.log('contextFile', fullPath);
      return {
        contextCardUrl: fullPath,
        s3uri: sciResults.s3uri
      }
    },
    splitInfoFromUrl: function (url) {
      // example url: "https://mapcore-demo.org/current/sparc-api-v2/s3-resource/221/3/files/derivative/Scaffolds/mouse_colon_metadata.json",
      // find the part after 's3-resource' 
      let s3path = url.split('s3-resource')[1];
      let basePath = url.split('files/')[0] + 'files/' // This gives us the base path for our relative path we will get from scicrunch

      // split the url by '/'
      const parts = s3path.split('/');
      // remove the first part
      parts.shift();
      // return the parts
      const datasetId = parts[0];

      return [datasetId, basePath];
    },
    getContextFileFromScicrunch: async function (datasetId) {
      // get the context file from scicrunch
      let results = await fetch(`${this.settingsStore.sparcApi}/dataset_info/using_multiple_discoverIds/?discoverIds=${datasetId}`)
        .then(response => response.json())
        .then(data => {
          // get the context file
          if (data.numberOfHits === 1) { // chgeck if there is only one hit
            const contextFile = data.results[0]['abi-contextual-information']

            // check if there is only one context file (We have no way of knowing which one to choose if there are multiple)
            if ( contextFile && contextFile.length === 1) {
              return {
                success: true,
                contextFile: contextFile[0], 
                s3uri: data.results[0]['s3uri']
              }
            }
          }
          return {success: false};
        }).catch(error => {
          console.error('Error:', error);
          return {success: false};
        });
      return results;
    }
  }
}
