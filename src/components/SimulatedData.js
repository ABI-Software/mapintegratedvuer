/* eslint-disable no-alert, no-console */
function getGenericMarkerInfo(term ,label, dataset, scaffold, simulations) {
  let data = {};
  data.dataset = dataset;
  data.scaffold = scaffold;
  data.simulations = simulations;
  if (label)
    data.title = label;
  else
    data.title = term;
  data.description = "";
  data.actions = [];
  if (term) {
    switch (term) {
    case "ICN":
        data.title = "RNA";
        data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
        data.actions = [
          {
            title: "Explore data",
            resource: "icn",
            type: "URL",
            label: "ICN",
            filter: {
              facet: 'genotype',
              term: 'heart'
            },
          },
          {
            title: "View plot",
            label: "ICN",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
            type: "Plot",
            plotType: "heatmap",
            datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
            datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
            datasetUrl: "https://discover.blackfynn.com/datasets/29",
            datasetImage: "https://assets.discover.blackfynn.com/dataset-assets/29/6/revisions/1/banner.jpg"
          },
        ];
        break;
      default:
        break;
    }
  } else {
    data.actions = [];
  }
  return data;
}


function getHumanData(term, label, dataset, scaffold, simulations) {
  if (term || label) {
    let data = {};
    switch (term) {
      case "UBERON:0001157":
        data.title = "Colon";
        data.description = "";
        data.actions = [
          {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "URL",
            filter: {
              facet: 'genotype',
              term: 'colon'
            },
          },
        ];
        break;
      default:
        data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        break;
    }
    return data;
  }
  return undefined;
}

function getRatData(term, label, dataset, scaffold, simulations) {
  if (term || label) {
    let data = {};
    switch (term) {
      case "UBERON:0000948":
      case "UBERON:0002080":
        if (!simulations) {
          data.title = "Heart";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Heart",
              resource: "https://sparc.science/data?type=dataset&q=heart",
              type: "URL"
            },
            {
              title: "Explore simulations",
              label: "Heart",
              resource: "https://sparc.science/data?type=simulation&q=heart",
              type: "URL"
            },
            {
              title: "View 3D scaffold",
              label: "Heart",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
              type: "Scaffold"
            },
          ];
        } else {
          data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        }
        break;
      case "UBERON:0001156":
        data.title = "Colon";
        data.description = "";
        data.actions = [
          {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "URL"
          },
        ];
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "URL"
            },
          ];
          break;
        case "UBERON:0001255":
          data.title = "Urinary bladder";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Bladder",
              resource: "https://sparc.science/data?type=dataset&q=bladder",
              type: "URL"
            },
          ];
        break;
        case "UBERON:0002048":
          data.title = "Lung";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Lung",
              resource: "https://sparc.science/data?type=dataset&q=lung",
              type: "URL"
            },
            {
              title: "View 3D scaffold",
              label: "Lung",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/lungs/28-may/lung_metadata.json",
              type: "Scaffold"
            },
          ];
          break;
      case "ICN":
        data.title = "RNA";
        data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
        data.actions = [
          {
            title: "Explore data",
            resource: "icn",
            type: "URL"
          },
          {
            title: "View plot",
            label: "ICN",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
            type: "Plot",
            plotType: "heatmap",
            datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
            datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
            datasetUrl: "https://discover.blackfynn.com/datasets/29",
            datasetImage: "https://assets.discover.blackfynn.com/dataset-assets/29/6/revisions/1/banner.jpg"
          },
        ];
        break;
      case "UBERON:0000945":
        data.title = "Stomach";
        data.description = "";
        data.actions = [
          {
            title: "Explore data",
            label: "Stomach",
            resource: "https://sparc.science/data?type=dataset&q=stomach",
            type: "URL"
          },
          {
            title: "View 3D scaffold",
            label: "Stomach",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/rat_stomach/new_stomach_neurites/stomach_neurites_metadata.json",
            type: "Scaffold"
          },
        ];
        break;
      case "UBERON:0001759":
        if (label)
          data.title = label;
        else
          data.title = "Vagus nerve";
        data.actions = [
          {
            title: "Explore data",
            label: "Vagus nerve",
            resource: "https://sparc.science/data?type=dataset&q=vagus+nerve",
            type: "URL"
          },
          {
            title: "Explore simulations",
            label: "Vagus nerve",
            resource: "https://sparc.science/data?type=simulation&q=vagus%20nerve",
            type: "URL"
          },
        ];
        break;
      default:
        data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        break;
    }
    return data;
  }
  return undefined;
}

function getMouseData(term, label, dataset, scaffold, simulations) {
  if (term || label) {
    let data = {};
    switch (term) {
      case "UBERON:0001156":
        data.title = "Colon";
        data.description = "";
        data.actions = [
          {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "URL"
          },
        ];
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "URL"
            },
          ];
          break;
      default:
        data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        break;
    }
    return data;
  }
  return undefined;
}

function getPigData(term, label, dataset, scaffold, simulations) {
  if (term || label) {
    let data = {};
    switch (term) {
      case "UBERON:0008972":
        data.title = "Colon";
        data.description = "";
        data.actions = [
          {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "URL"
          },
        ];
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = [
            {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "URL"
            },
          ];
          break;
      default:
        data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        break;
    }
    return data;
  }
  return undefined;
}

export function simulatedData(term, taxonomy, label, dataset, scaffold, simulations) {
  switch (taxonomy) {
    case "NCBITaxon:9606":
        return getHumanData(term, label, dataset, scaffold, simulations);
    case "NCBITaxon:9823":
        return getPigData(term, label, dataset, scaffold, simulations);
    case "NCBITaxon:10090":
      return getMouseData(term, label, dataset, scaffold, simulations);
    case "NCBITaxon:10114":
      return getRatData(term, label, dataset, scaffold, simulations);
    default:
      return getGenericMarkerInfo(term, taxonomy, label, dataset, scaffold, simulations);
  }
}

function getRatTerms() {
  return [
    {id: "UBERON:0000948", type:"simulation"},
    {id: "UBERON:0001156", type:"simulation"},
    {id: "UBERON:0001255", type:"simulation"},
    {id: "UBERON:0000945", type:"simulation"},
    {id: "UBERON:0001759", type:"simulation"},
    {id: "UBERON:0002108", type:"simulation"},
  ];
}

export function getAvailableTermsForSpecies(taxonomy) {
  switch (taxonomy) {
    case "NCBITaxon:9606":
      return {};
      case "NCBITaxon:9823":
        return {};
    case "NCBITaxon:10090":
      return {};
    case "NCBITaxon:10114":
      return getRatTerms();
    default:
      return {};
  }
}