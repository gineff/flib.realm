const getText = async (url)=> {
  const response = await context.http.get({url});
  return response.body.text();
};

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

const checkLibrarySiteStatus = async (query)=> {
  const library = await context.functions.execute("getLibrary", query);
  if(!library) return 4// mongodb is unavailable
  return library.status; //1 site is available; 2 reserve site is available; 3 site is unavailable
}

exports = ()=>{return {getText, getLibrary, checkLibrarySiteStatus}}
