const initialDefaultState = () => {
  return {
    mainTabName: "Flatmap",
    zIndex: 1,
    showDialogIcons: false,
    activeDockedId: 1,
    currentCount: 1,
    entries: [
      {
        resource: "Rat",
        type: "MultiFlatmap",
        zIndex: 1,
        mode: "main",
        id: 1,
        state: undefined,
        label: "",
        discoverId: undefined
      }
    ],
    sideBarVisibility: true,
    search: '',
    startUp: true
  };
}

/*
 * Initial state for the split flow
 */
const initialState = async (type, sparcApi) => {
  const state = initialDefaultState();
  if (type === "FC") {
    state.mainTabName = "Flatmap";
    state.entries[0].resource = "FunctionalConnectivity";
    state.entries[0].type = "Flatmap";
    state.entries[0].label = "Functional";
  } else if (type === "WholeBody") {
    const url = await getBodyScaffold(sparcApi, "human");
    state.mainTabName = "Scaffold";
    state.entries[0].resource = url;
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

/*
 * Provide a list of available species for the flatmap
 */
const availableSpecies = () => {
  return {
    "Human Female": { taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000383", iconClass: "mapicon-icon_human", displayLatestChanges: true, displayWarning: true },
    "Human Male": { taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000384", iconClass: "mapicon-icon_human", displayLatestChanges: true, displayWarning: true },
    "Rat": { taxo: "NCBITaxon:10114", iconClass: "mapicon-icon_rat", displayLatestChanges: true },
    "Mouse": { taxo: "NCBITaxon:10090", iconClass: "mapicon-icon_mouse", displayLatestChanges: true, displayWarning: true },
    "Pig": { taxo: "NCBITaxon:9823", iconClass: "mapicon-icon_pig", displayLatestChanges: true, displayWarning: true },
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

const extractS3BucketName = uri => {
  if (uri) {
    const substring = uri.split("//")[1]
    if (substring) {
      return substring.split("/")[0]
    }
  }
  return undefined
}

const getBodyScaffold = async (sparcApi, species) => {
  //Get body scaffold information
  const response = await fetch(`${sparcApi}get_body_scaffold_info/${species}`);
  if (response.ok) {
    const data = await response.json();
    //Construct the url endpoint for downloading the scaffold
    const bucket = extractS3BucketName(data.s3uri);
    return `${sparcApi}s3-resource/${data.id}/${data.version}/files/${data.path}?s3BucketName=${bucket}`;
  } else {
    //Use default url if data is not found for any reason
    if (species === "rat") {
      return "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/31-May-2021/ratBody/ratBody_syncmap_metadata.json";
    } else if (species === "human") {
      return "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/27-4-23-human/human_body_metadata.json";
    }
  }
}

exports.availableSpecies = availableSpecies;
exports.capitalise = capitalise;
exports.findSpeciesKey = findSpeciesKey;
exports.initialState = initialState;
exports.initialDefaultState = initialDefaultState;
exports.getBodyScaffold = getBodyScaffold;