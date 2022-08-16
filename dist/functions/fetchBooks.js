exports = async ()=> {

  const {getOpds, xmlParser,  getLibrary} =  context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  const fetchBooks = async (lib)=> {

    const fetchUrl = lib.url+lib.fetchUrl.replace("$page");
    const xml = await getOpds(fetchUrl);
    return xmlParser(xml);

  }

  const arr = new Array(10).fill(0);

  for (let key of arr) {
    const books = await fetchBooks(await getLibrary({_id: 1}));
    Books.insertMany(books);
  }
};
