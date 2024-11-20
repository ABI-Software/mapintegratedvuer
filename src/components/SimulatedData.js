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

