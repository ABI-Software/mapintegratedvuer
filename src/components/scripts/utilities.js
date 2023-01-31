const initialState = () => {
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
        zIndex:1,
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
  }
}

const capitalise = term =>  {
  if (term)
    return term.charAt(0).toUpperCase() + term.slice(1);
  return term;
};

const availableSpecies = () => {
  return {
    "Human Female":{taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000383", iconClass:"mapicon-icon_human", displayWarning:true},
    "Human Male":{taxo: "NCBITaxon:9606", biologicalSex: "PATO:0000384", iconClass:"mapicon-icon_human", displayWarning:true},
    "Rat":{taxo: "NCBITaxon:10114", iconClass:"mapicon-icon_rat", displayLatestChanges: true},
    "Mouse":{taxo: "NCBITaxon:10090", iconClass:"mapicon-icon_mouse", displayWarning: true},
    "Pig":{taxo: "NCBITaxon:9823", iconClass:"mapicon-icon_pig", displayWarning: true},
    "Cat":{taxo: "NCBITaxon:9685", iconClass:"mapicon-icon_cat", displayWarning: true},
  }
}

const findSpeciesKey = condition => {
  if (condition) {
    const list = availableSpecies();
    const keys = Object.keys(list);
    for (let i = 0; i < keys.length; i++) {
      if (condition.taxo === list[keys[i]].taxo) {
        if (condition.biologicalSex) {
          if (condition.biologicalSex === list[keys[i]].biologicalSex)
            return keys[i];
        } else {
          return keys[i];
        }
      }
    }
  }
  return "";
}

exports.availableSpecies = availableSpecies;
exports.capitalise = capitalise;
exports.findSpeciesKey = findSpeciesKey;
exports.initialState = initialState;
