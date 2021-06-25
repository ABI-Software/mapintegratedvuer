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
        data.actions = {
          search: {
            title: "Explore data",
            resource: "icn",
            type: "Search",
            label: "ICN",
            filter: {
              facet: 'genotype',
              term: 'heart'
            },
          },
          plot: {
            title: "View plot",
            label: "ICN",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
            type: "Plot",
            plotType: "heatmap",
            datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
            datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
            datasetUrl: "https://discover.pennsieve.io/datasets/29",
            datasetImage: "https://assets.discover.pennsieve.io/dataset-assets/29/6/revisions/1/banner.jpg"
          },
        };
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
        data.actions = {
          search: {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "Search",
            filter: {
              facet: 'genotype',
              term: 'colon'
            },
          },
          scaffold: {
            title: "View 3D scaffold",
            label: "Colon",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Colon/human/humanColon_metadata.json",
            type: "Scaffold"
          },
        };
        break;
        case "UBERON:0000948":
        case "UBERON:0002080": {
          data.title = "Heart";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Heart",
              resource: "https://sparc.science/data?type=dataset&q=colon",
              type: "Search",
              filter: {
                facet: 'genotype',
                term: 'heart'
              },
            },
            scaffold: {
              title: "View 3D scaffold",
              label: "Heart",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/human/humanHeart_metadata.json",
              type: "Scaffold"
            },
          };
        }
        break;
        case "UBERON:0002048":
            data.title = "Lung";
            data.description = "";
            data.actions = {
              search: {
                title: "Explore data",
                label: "Lung",
                resource: "https://sparc.science/data?type=dataset&q=lung",
                type: "Search"
              },
              scaffold: {
                title: "View 3D scaffold",
                label: "Lung",
                resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Lungs/human/humanLeftLung_metadata.json",
                type: "Scaffold"
              },
            };
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
          data.actions = {
            search: {
              title: "Explore data",
              label: "Heart",
              resource: "https://sparc.science/data?type=dataset&q=heart",
              type: "Search",
              filter: {
                facet: 'genotype',
                term: 'heart'
              },
            },
            scaffold: {
              title: "View 3D scaffold",
              label: "Heart",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/rat/ratHeart_metadata.json",
              type: "Scaffold"
            },
            simulation: {
              title: "Explore simulations",
              label: "Heart",
              resource: "https://sparc.science/data?type=simulation&q=heart",
              type: "URL"
            },
          };
        } else {
          data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        }
        break;
      case "UBERON:0001156":
        data.title = "Colon";
        data.description = "";
        data.actions = {
          search: {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "Search"
          },
        };
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "Search"
            },
          };
          break;
        case "UBERON:0001255":
          data.title = "Urinary bladder";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Bladder",
              resource: "https://sparc.science/data?type=dataset&q=bladder",
              type: "Search"
            },
            scaffold: {
              title: "View 3D scaffold",
              label: "Bladder",
              resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Bladder/rat/ratBladder_metadata.json",
              type: "Scaffold"
            },
          };
        break;
        case "UBERON:0002048":
          data.title = "Lung";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Lung",
              resource: "https://sparc.science/data?type=dataset&q=lung",
              type: "Search"
            },
          };
          break;
      case "ICN":
        data.title = "RNA";
        data.description = "The distribution of neurons in the intrinsic cardiac nervous system (ICN) were mapped and visualized in a 3D reconstruction of a male rat heart.";
        data.actions = {
          search: {
            title: "Explore data",
            resource: "icn",
            type: "Search"
          },
          plot: {
            title: "View plot",
            label: "ICN",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/use-case-4/RNA_Seq.csv",
            type: "Plot",
            plotType: "heatmap",
            datasetTitle: "Molecular Phenotype Distribution of Single Rat Intracardiac Neurons",
            datasetDescription: "Images collected from serial cryostat sectioning of a cryopreserved heart was used to reconstruct the 3D context. Transcriptional profiles taken from isolated single neurons and mapped back into the previously generated 3D context.",
            datasetUrl: "https://discover.pennsieve.io/datasets/29",
            datasetImage: "https://assets.discover.pennsieve.io/dataset-assets/29/6/revisions/1/banner.jpg"
          },
        };
        break;
      case "UBERON:0000945":
      case "UBERON:0001160":
      case "UBERON:0001161":
        data.title = "Stomach";
        data.description = "";
        data.actions = {
          search: {
            title: "Explore data",
            label: "Stomach",
            resource: "https://sparc.science/data?type=dataset&q=stomach",
            type: "Search"
          },
          scaffold: {
            title: "View 3D scaffold",
            label: "Stomach",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Stomach/rat/ratStomach_metadata.json",
            type: "Scaffold"
          },
        };
        break;
      case "UBERON:0001759":
        if (label)
          data.title = label;
        else
          data.title = "Vagus nerve";
        data.actions = {
          search: {
            title: "Explore data",
            label: "Vagus nerve",
            resource: "https://sparc.science/data?type=dataset&q=vagus+nerve",
            type: "Search"
          },
          simulation: {
            title: "Explore simulations",
            label: "Vagus nerve",
            resource: "https://sparc.science/data?type=simulation&q=vagus%20nerve",
            type: "simulation"
          },
        };
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
        data.actions = {
          search: {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "Search"
          },
          scaffold: {
            title: "View 3D scaffold",
            label: "Colon",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Colon/mouse/mouseColon_metadata.json",
            type: "Scaffold"
          },
        };
        break;
      case "UBERON:0002048":
        data.title = "Lung";
        data.description = "";
        data.actions = {
          search: {
            title: "Explore data",
            label: "Lung",
            resource: "https://sparc.science/data?type=dataset&q=lung",
            type: "Search"
          },
          scaffold: {
            title: "View 3D scaffold",
            label: "Lung",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Lungs/mouse/mouseLeftLung_metadata.json",
            type: "Scaffold"
          },
        };
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "Search"
            },
          };
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
        data.actions = {
          search: {
            title: "Explore data",
            label: "Colon",
            resource: "https://sparc.science/data?type=dataset&q=colon",
            type: "Search"
          },
          scaffold: {
            title: "View 3D scaffold",
            label: "Colon",
            resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Colon/pig/pigColon_metadata.json",
            type: "Scaffold"
          },
        };
        break;
        case "UBERON:0002108":
          data.title = "Small intestines";
          data.description = "";
          data.actions = {
            search: {
              title: "Explore data",
              label: "Colon",
              resource: "https://sparc.science/data?type=dataset&q=small+intestines",
              type: "Search"
            },
          };
          break;
          case "UBERON:0000948":
            case "UBERON:0002080": {
              data.title = "Heart";
              data.description = "";
              data.actions = {
                search: {
                  title: "Explore data",
                  label: "Heart",
                  resource: "https://sparc.science/data?type=dataset&q=colon",
                  type: "Search",
                  filter: {
                    facet: 'genotype',
                    term: 'heart'
                  },
                },
                scaffold: {
                  title: "View 3D scaffold",
                  label: "Heart",
                  resource: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/Generic+Scaffold/Heart/pig/pigHeart_metadata.json",
                  type: "Scaffold"
                },
              };
            }
            break;
      default:
        data = getGenericMarkerInfo(term, label, dataset, scaffold, simulations);
        break;
    }
    return data;
  }
  return undefined;
}

function simulatedData(term, taxonomy, label, dataset, scaffold, simulations) {
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

export function getInteractiveAction(result, action) {
  if (result && result.resource) {
    let resource = result.resource;
    if (Array.isArray(resource) && resource[0])
      resource = resource[0];
    let term = undefined;
    let label = undefined;
    let dataset = undefined;
    let scaffold = undefined;
    let simulations = undefined;
    let taxonomy = resource.taxonomy;
    if (resource.data && resource.data.id) {
      term = resource.data.id;
      label = resource.data.id;
    } else if (resource.feature) {
      term = resource.feature.models;
      label = resource.feature.label;
      dataset = resource.feature.dataset;
      scaffold = resource.feature.scaffold;
      simulations = resource.feature.simulations;
    }
    if (term || label) {
      let data = simulatedData(term, taxonomy, label, dataset, scaffold, simulations);
      if (data && data.actions) {
        return data.actions[action];
      }
    }
  }
  return undefined;
}

export { simulatedData };
