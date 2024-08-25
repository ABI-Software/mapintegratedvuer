/**
 * 
 * @param {*} sparcApi
 * @returns 
 */
const getOrganCuries = async (sparcApi) => {
  const response = await fetch(`${sparcApi}/get-organ-curies/`);
  const data = await response.json();

  let identifiers = [];
  data.uberon.array.forEach((pair) => {
    const identifier = {
      id: pair.id.toUpperCase(),
      name: pair.name,
    };
    identifiers.push(identifier);
  });

  return identifiers;
};

export {
  getOrganCuries
};
