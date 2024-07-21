const nerveMaps = [
  {
      "id": "ilxtr:neuron-type-keast-13",
      "centrelines": [
          "n_71"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-2",
      "centrelines": [
          "bladder_n"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-3",
      "centrelines": [
          "bladder_n",
          "hypogastric_n"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-15",
      "centrelines": [
          "n_73"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-1",
      "centrelines": [
          "bladder_n"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-7",
      "centrelines": [
          "L1_ventral_root_ramus",
          "L1_spinal_n-1",
          "lumbar_splanchnic_n",
          "L2_spinal_n",
          "L2_ventral_root_ramus"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-9",
      "centrelines": [
          "L6_spinal_n-1",
          "L6_ventral_root",
          "pudendal_n",
          "L5_spinal_n",
          "L5_ventral_root"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-10",
      "centrelines": [
          "S1_dorsal_root",
          "S1_spinal_n-2",
          "pelvic_splanchnic_n",
          "L6_spinal_n-2",
          "L6_dorsal_root",
          "bladder_n"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-11",
      "centrelines": [
          "lumbar_splanchnic_n",
          "L2_spinal_n",
          "L1_spinal_n-1",
          "hypogastric_n",
          "bladder_n",
          "L1_dorsal_root",
          "L2_dorsal_root"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-12",
      "centrelines": [
          "L6_spinal_n-1",
          "L6_dorsal_root",
          "pudendal_n",
          "S1_spinal_n-1",
          "S1_dorsal_root"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-8",
      "centrelines": [
          "L1_ventral_root_paravertebral_ganglion",
          "L1-L2_interganglionic_segment",
          "sympathetic_trunk_T13-L1",
          "L2_ventral_root_paravertebral_ganglion",
          "sympathetic_trunk_L2-L3",
          "sympathetic_trunk_L4-L5",
          "sympathetic_trunk_L3-L4",
          "sympathetic_trunk_L5-L6",
          "sympathetic_trunk_T12-T13"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-20",
      "centrelines": [
          "T1_T2_cns",
          "C8_T1_cns",
          "T2_T3_cns",
          "T10_T11_cns",
          "T9_T10_cns",
          "T11_T12_cns",
          "T8_T9_cns",
          "C7_C8_cns",
          "C6_C7_cns",
          "C4_C5_cns",
          "C3_C4_cns",
          "C5_C6_cns",
          "medulla_C1_cns",
          "pons_medulla_cns",
          "C1_C2_cns",
          "T5_T6_cns",
          "T4_T5_cns",
          "T6_T7_cns",
          "L3_L4_cns",
          "L2_L3_cns",
          "L4_L5_cns",
          "L5_L6_cns",
          "T13_L1_cns",
          "T12_T13_cns",
          "L1_L2_cns",
          "T3_T4_cns",
          "n_69",
          "C2_C3_cns",
          "T7_T8_cns"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-16",
      "centrelines": [
          "n_74"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-4",
      "centrelines": [
          "sympathetic_trunk_L6-S1",
          "L6_gray_ramus-spinal_n",
          "sympathetic_trunk_L5-L6",
          "S1_gray_ramus-spinal_n",
          "S1_spinal_n-2",
          "pelvic_splanchnic_n",
          "L6_spinal_n-2",
          "L1-L2_interganglionic_segment",
          "sympathetic_trunk_T13-L1",
          "sympathetic_trunk_L2-L3",
          "bladder_n",
          "sympathetic_trunk_L4-L5",
          "sympathetic_trunk_L3-L4",
          "sympathetic_trunk_T12-T13"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-17",
      "centrelines": [
          "n_75"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-5",
      "centrelines": [
          "S1_ventral_root",
          "S1_spinal_n-2",
          "pelvic_splanchnic_n",
          "L6_spinal_n-2",
          "L6_ventral_root"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-18",
      "centrelines": [
          "n_70"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-6",
      "centrelines": [
          "L1_ventral_root_ramus",
          "L1_spinal_n-1",
          "lumbar_splanchnic_n",
          "L2_spinal_n",
          "hypogastric_n",
          "L2_ventral_root_ramus"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-19",
      "centrelines": [
          "n_69"
      ]
  },
  {
      "id": "ilxtr:neuron-type-keast-14",
      "centrelines": [
          "n_72"
      ]
  }
];



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
            term: "Colon",
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
              term: "Heart",
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
              term: "Heart",
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
              label: "Urinary Bladder",
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
                  term: "Heart",
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
    {id: "UBERON:0000948", name: "Heart", type:"simulation"},
    {id: "UBERON:0001156", name: "Colon", type:"simulation"},
    {id: "UBERON:0001255", name: "Bladder", type:"simulation"},
    {id: "UBERON:0000945", name: "Stomach", type:"simulation"},
    {id: "UBERON:0001759", name: "Vagus nerve", type:"simulation"},
    {id: "UBERON:0002108", name: "Small intestines", type:"simulation"},
    {id: "UBERON:0002107", name: "Liver", type:"simulation"},
  ];
}

export function getAvailableTermsForSpecies() {
  return getRatTerms();
}

// Find the id/centre lines for the matchin centre lines/id
export function getNerveNames(name) {
  if (name) {
    for (let i = 0; i < nerveMaps.length ; i++) {
      if (nerveMaps[i].id == name) {
        return nerveMaps[i].centrelines;
      }
      const found = nerveMaps[i].centrelines.find(element => element === name);
      if (found)
        return [nerveMaps[i].id];
    }
  }
  return [];
}

export function getParentsRegion(name) {
  if (name) {
    const lName = name.toLowerCase()
    if (lName.includes('heart')) {
      return {id: 'UBERON:0000948', name: 'Heart'};
    } else if (lName.includes('liver')) {
      return {id: 'UBERON:0002107', name: 'Liver'};
    } else if (lName.includes('stomach')) {
      return {id: 'UBERON:0000945', name: 'Stomach'};
    } else if (lName.includes('colon')) {
      return {id: 'UBERON:0001156', name: 'Colon'};
    } else if (lName.includes('bladder')) {
      return {id: 'UBERON:0001255', name: 'Bladder'};
    }
  }
  return undefined;
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
