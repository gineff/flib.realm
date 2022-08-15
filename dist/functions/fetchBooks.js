exports = async function() {

  const {getOpds, xmlParser,  getLibrary} =  context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  const fetchBooks = async (lib)=> {

    const fetchUrl = lib.url+lib.fetchUrl.replace("$page");
    const now = new Date();
    const xml = await getOpds(fetchUrl);
    const books = xmlParser(xml);
    return books.map(el=>({...el, _id: ObjectId(), lid : lib._id, date: now}))

  }

  const arr = new Array(10).fill(0);

  for (let key of arr) {
    const books = await  fetchBooks(await getLibrary({_id: 1}));
    for (let book of books) {
      try{
        //Books.insertMany()
      }catch (e) {

      }
    }
  }

};
