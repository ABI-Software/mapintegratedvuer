const resolveURL = (relative, base) => {
  const resolved = new URL(relative, base);
  return resolved.href;
}

const readProtocolData = async (item, baseUrl) => {
  if (item && item.resource?.url) {
    const resolvedUrl = resolveURL(item.resource.url, baseUrl);
    const response = await fetch(resolvedUrl)
    const data = await response.json()
    //convert url
    const fields = ["csv_file", "protocol", "thumbnail"]
    data.forEach((protocol) => {
      fields.forEach((field) => {
        if (field in protocol) {
          protocol[field] = resolveURL(protocol[field], resolvedUrl)
        }
      });
    })
    return data
  }

  return
}

const updateProtocolData = async (entry, baseUrl) => {
  if (entry["simulation-protocols"]) {
    const processedData = [];
    for (const item of entry["simulation-protocols"]) {
      const data = await readProtocolData(item, baseUrl);
      if (data) {
        processedData.push(...data);
      }
    }
    return processedData;
  }
}

const getProtocolData = async (uuid, data, baseUrl) => {
  const processedResults = [];
  for (const entry of data) {
    let found = false;
    if (entry.flatmaps) {
      for (const flatmap of entry.flatmaps) {
        if (flatmap.associated_flatmap?.identifier === uuid) {
          found = true;
        }
      }
    }
    if (found) {
      const results = await updateProtocolData(entry, baseUrl);
      if (results) {
        processedResults.push(...results);
      }
    }
  }
  return processedResults;
}

const retrieveProtocolData = async (url, uuid) => {
  if (url) {
    const response = await fetch(url);
    const data = await response.json();
    return await getProtocolData(uuid, data, url);
  }
  return undefined;
}

export {
  retrieveProtocolData
};