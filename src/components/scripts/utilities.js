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

const getNewMapEntry = async (type) => {
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
    /*
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
    */
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
  /*
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
  */

  return state;
}

const capitalise = term => {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
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
  capitalise,
  findSpeciesKey,
  defaultSpecies,
  initialState,
  initialDefaultState,
  getNewMapEntry,
  intersectArrays,
  transformObjToString,
  transformStringToObj,
}
