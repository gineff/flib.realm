exports = (arg) => {
  const {getText, htmlParser, xmlParser, getLibraryUrl, getBooksNotInDb} =  context.functions.execute("mainFunctions");
  const Lists = context.services.get("mongodb-atlas").db("flibusta").collection("Lists");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  let url;

  const checkAddToDb = async books => {
    const BooksNotInDb = await getBooksNotInDb(books);
    const basket = [];

    for(let book of BooksNotInDb){
      console.log("book Not In Db", JSON.stringify(book.title));
      const bookFromOPDS = await searchBookByAuthor(book);
      if(bookFromOPDS) basket.push(bookFromOPDS);
    }

    if(basket.length){
      const {insertedIds} = await Books.insertMany(basket, {ordered: false, silent: true});
      return insertedIds;
    }else{
      return [];
    }
  };

  const searchBookByAuthor = async (book, searchPage = 1)=> {
    console.log("search in opds by author", searchPage, book.title);
    if(!book.author[0].id) return undefined;
    const text = await getText(`http://${url}/opds/author/${book.author[0].id}/time/${(searchPage-1)}`);
    const data = xmlParser(text);
    const filteredData = data.filter(el => el.bid === book.bid)[0];
    if(data.length === 20 && filteredData === undefined){
      return await searchBookByAuthor(book, ++searchPage);
    }else{
      return filteredData;
    }
  };

  const getList  = async function(listId) {

    listId = (listId === "w" || listId === "24")? listId : "w";

    url = await getLibraryUrl({_id: 1})
    const text = await getText(`http://${url}/stat/${listId}`);
    const list = htmlParser("List", text);
    await checkAddToDb(list);
    const bidOfBooks = list.map(el=>el.bid);
    const idOfBooks =  await Books.find({lid: 1, bid: {$in: bidOfBooks}}, {_id: 1}).toArray();
    if(Array.isArray(booksId) && booksId.length){

      Lists.updateOne({_id:`1_${listId}`},
        {_id:`1_${listId}`,
          lib_id:1,
          name: `popular ${listId}`,
          data: booksId,
          updatedAt: new Date()},
        {upsert: true});
    }
  };

  getList(arg);
}
