const defaultSpecies = 'Human Male';

const initialDefaultState = () => {
  return {
    entries: [
      {
        resource: defaultSpecies,
        type: "MultiFlatmap",
        mode: "main",
        id: 1,
        state: undefined,
        label: "",
        discoverId: undefined
      }
    ],
  };
}

const getNewMapEntry = async (type, sparcApi) => {
  let entry = { };
  if (type === "AC") {
    entry = {
      resource: defaultSpecies,
      type: "MultiFlatmap",
      mode: "main",
      state: undefined,
      label: "",
      discoverId: undefined
    };
  } else if (type === "FC") {
    entry = {
      resource: "FunctionalConnectivity",
      type: "Flatmap",
      mode: "main",
      state: undefined,
      label: "Functional",
      discoverId: undefined
    }
  } else if (type === "3D") {
    const data = await getBodyScaffoldInfo(sparcApi, "human");
    entry = {
      resource: data.url,
      type: "Scaffold",
      mode: "main",
      state: undefined,
      label: "Human",
      discoverId: data.datasetInfo.discoverId,
      contextCardUrl: data.datasetInfo.contextCardUrl,
      s3uri: data.datasetInfo.s3uri,
      version: data.datasetInfo.version,
      isBodyScaffold: true,
    };
  } else if (type === "CG") {
    entry = {
      resource: "ConnectivityGraph",
      type: "ConnectivityGraph",
      mode: "main",
      state: undefined,
      label: "Connectivity Graph",
      discoverId: undefined
    }
  }

  return entry;
}

/*
 * Initial state for the split flow
 */
const initialState = async (type, sparcApi) => {
  const state = initialDefaultState();
  if (type === "FC") {
    state.entries[0].resource = "FunctionalConnectivity";
    state.entries[0].type = "Flatmap";
    state.entries[0].label = "Functional";
  } else if (type === "WholeBody") {
    const data = await getBodyScaffoldInfo(sparcApi, "human");
    state.entries[0].resource = data.url;
    state.entries[0].contextCardUrl = data.datasetInfo.contextCardUrl;
    state.entries[0].discoverId = data.datasetInfo.discoverId,
    state.entries[0].s3uri = data.datasetInfo.s3uri;
    state.entries[0].version = data.datasetInfo.version;
    state.entries[0].type = "Scaffold";
    state.entries[0].label = "Human";
    state.entries[0].isBodyScaffold = true;
  }

  return state;
}

const capitalise = term => {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
};

// Supported higher-level taxonomy mappings to species represented in availableSpecies.
const speciesTaxonHierarchy = {
  // Mammalian clades that can appear in knowledge provenance.
  "NCBITaxon:40674": ["NCBITaxon:9606", "NCBITaxon:10114", "NCBITaxon:10090", "NCBITaxon:9823", "NCBITaxon:9685"],
  "NCBITaxon:32525": ["NCBITaxon:9606", "NCBITaxon:10114", "NCBITaxon:10090", "NCBITaxon:9823", "NCBITaxon:9685"],
  "NCBITaxon:9347": ["NCBITaxon:9606", "NCBITaxon:10114", "NCBITaxon:10090", "NCBITaxon:9823", "NCBITaxon:9685"],
  "NCBITaxon:1437010": ["NCBITaxon:9606", "NCBITaxon:10114", "NCBITaxon:10090", "NCBITaxon:9823", "NCBITaxon:9685"],
  "NCBITaxon:314146": ["NCBITaxon:9606", "NCBITaxon:10114", "NCBITaxon:10090"],
  "NCBITaxon:9443": ["NCBITaxon:9606"],
  "NCBITaxon:9604": ["NCBITaxon:9606"],
  "NCBITaxon:9989": ["NCBITaxon:10114", "NCBITaxon:10090"],
  "NCBITaxon:10066": ["NCBITaxon:10114", "NCBITaxon:10090"],
  "NCBITaxon:33554": ["NCBITaxon:9685"],
  "NCBITaxon:9681": ["NCBITaxon:9685"],
  "NCBITaxon:91561": ["NCBITaxon:9823"],
  "NCBITaxon:9821": ["NCBITaxon:9823"],

  // Common species aliases and closely related terms in external datasets.
  "NCBITaxon:10116": ["NCBITaxon:10114"],
  "NCBITaxon:9825": ["NCBITaxon:9823"],
};

/*
 * Provide a list of available species for the flatmap
 */
const availableSpecies = () => {
  return {
    "Human Female": { taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000383", iconClass: "mapicon-icon_human", displayLatestChanges: true, displayWarning: false },
    "Human Male": { taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000384", iconClass: "mapicon-icon_human", displayLatestChanges: true, displayWarning: false },
    "Rat": { taxo: "NCBITaxon:10114", iconClass: "mapicon-icon_rat", displayLatestChanges: true, displayWarning: false },
    "Mouse": { taxo: "NCBITaxon:10090", iconClass: "mapicon-icon_mouse", displayLatestChanges: true, displayWarning: false },
    "Pig": { taxo: "NCBITaxon:9823", iconClass: "mapicon-icon_pig", displayLatestChanges: true, displayWarning: false },
    "Cat": { taxo: "NCBITaxon:9685", iconClass: "mapicon-icon_cat", displayLatestChanges: true, displayWarning: true },
  }
}

const getSpeciesForTaxons = (taxons = []) => {
  if (!Array.isArray(taxons) || !taxons.length) {
    return [];
  }

  const expandedTaxons = new Set();
  taxons.forEach((taxon) => {
    expandedTaxons.add(taxon);
    const descendants = speciesTaxonHierarchy[taxon];
    if (Array.isArray(descendants)) {
      descendants.forEach((descendant) => expandedTaxons.add(descendant));
    }
  });

  const speciesList = availableSpecies();
  const matchedSpecies = [];
  Object.keys(speciesList).forEach((name) => {
    const speciesTaxon = speciesList[name]?.taxo;
    const iconClass = speciesList[name]?.iconClass;
    if (speciesTaxon && expandedTaxons.has(speciesTaxon)) {
      matchedSpecies.push({
        name,
        iconClass,
        taxo: speciesTaxon,
      });
    }
  });

  return matchedSpecies;
}

/*
 * Look for the key in availableSpecies with the provided condition
 */
const findSpeciesKey = condition => {
  if (condition) {
    const list = availableSpecies();
    for (let key in list) {
      if (condition.taxo === list[key].taxo) {
        if (condition.biologicalSex && list[key].biologicalSex) {
          if (condition.biologicalSex === list[key].biologicalSex)
            return key;
        } else {
          return key;
        }
      }
    }
  }
  return "";
}

const extractS3BucketNameAndPrefix = uri => {
  if (uri) {
    const substring = uri.split("//")[1];
    if (substring) {
      const s3Bucket = substring.split("/")[0];
      const n = substring.indexOf('/');
      const s3Prefix = substring.substring(n + 1);
      return {
        s3Bucket,
        s3Prefix
      };
    }
  }
  return undefined
}

const getBodyScaffoldInfo = async (sparcApi, species) => {
  //Get body scaffold information
  let url = "";
  let datasetInfo = undefined;
  const response = await fetch(`${sparcApi}get_body_scaffold_info/${species}`);
  if (response.ok) {
    const data = await response.json();
    //Construct the url endpoint for downloading the scaffold
    const bucketInfo = extractS3BucketNameAndPrefix(data.s3uri);
    url = `${sparcApi}s3-resource/${bucketInfo.s3Prefix}files/${data.path}?s3BucketName=${bucketInfo.s3Bucket}`;
    const contextCardUrl = `${sparcApi}s3-resource/${bucketInfo.s3Prefix}files/${data.contextinfo}?s3BucketName=${bucketInfo.s3Bucket}`;
    datasetInfo = {
      s3uri: data.s3uri,
      contextCardUrl,
      discoverId: data.id,
      version: data.version,
    };
  } else {
    //Use default url if data is not found for any reason
    if (species === "rat") {
      url = "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json";
    } else if (species === "human") {
      url = "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/27-4-23-human/human_body_metadata.json";
    }
  }

  return {url, datasetInfo};
}

// Array intersection
const intersectArrays = (arr1, arr2) => {
  const lowerArr2 = arr2.map(x => typeof x === 'string' ? x.toLowerCase() : x);
  return arr1.filter(x =>
    typeof x === 'string'
      ? lowerArr2.includes(x.toLowerCase())
      : lowerArr2.includes(x)
  );
};

// Not using URLSearchParams to avoid encoding spaces
const transformObjToString = (obj) => {
  return Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join('&');
};

const transformStringToObj = (str) => {
  const params = new URLSearchParams(str);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
};

const listsAreEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
};

export {
  listsAreEqual,
  availableSpecies,
  getSpeciesForTaxons,
  capitalise,
  findSpeciesKey,
  defaultSpecies,
  initialState,
  initialDefaultState,
  getBodyScaffoldInfo,
  getNewMapEntry,
  intersectArrays,
  transformObjToString,
  transformStringToObj,
}
