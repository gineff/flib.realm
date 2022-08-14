
const checkLibrarySiteStatus = async (query)=> {
  const library = await context.functions.execute("getLibrary", query);
  if(!library) return 4// mongodb is unavailable
  return library.status; //1 site is available; 2 reserve site is available; 3 site is unavailable
}

exports = checkLibrarySiteStatus
