export default {
  sendEvent: function(data) {
    const taggingData = {
      event: data.event || '',
      event_name: data.event_name || '',
      files: data.files || '',
      file_name: data.file_name || '',
      file_path: data.file_path || '',
      file_type: data.file_type || '',
      category: data.category || '',
      dataset_id: data.dataset_id || '',
      version_id: data.version_id || '',
      doi: data.doi || '',
      citation_type: data.citation_type || '',
      location: data.location || ''
    }

    console.table(taggingData)

    // push to dataLayer for GTM
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push(taggingData)
    }
  }
}
