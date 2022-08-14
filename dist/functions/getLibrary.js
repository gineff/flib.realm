
const getLibrary = async (query) => {
  const libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Libraries");
  let library;
  try{
    library = await libraries.findOne(query);
  }catch (e) {
    return false;
  }
  return library;

}

exports = getLibrary
