exports = async ()=> {

  const {getText, xmlParser,  getLibrary} =  context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  const fetchBooks = async (lib, page)=> {

    const fetchUrl = "http://"+lib.url+lib.fetchUrl.replace("$page", page);
    const xml = await getText(fetchUrl);
    return xmlParser(xml);

  }

  const arr = [0,1,2,3,4,5,6,7,8,9,10];

  for (let page of arr) {
    const books = await fetchBooks(await getLibrary({_id: 1}), page);
    console.log(page, books.length)
    try{
      await Books.insertMany(books, {ordered: false});
    }catch (e) {
      console.log(e);
      break;
    }
  }
}
