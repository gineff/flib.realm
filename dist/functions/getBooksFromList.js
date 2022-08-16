exports = () => {
  const {getText, htmlParser, xmlParser, getLibraryUrl} =  context.functions.execute("mainFunctions");
  const Lists = context.services.get("mongodb-atlas").db("flibusta").collection("Lists");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  let url;

  const checkAddToDb = async books => {

    const idOfBooks =  books.map(el=>el.bid);
    const booksInDb = await Books.find({bid: {$in: idOfBooks}},{bid:1}).toArray();
    const booksIDInDb= booksInDb.map(el=>el.bid);
    const basket = [];

    for(let book of books){
      if(!booksIDInDb.includes(book.bid)){
        console.log("book Not In Db", JSON.stringify(book.title));
        const bookFromOPDS = await searchBookByAuthor(book);
        if(bookFromOPDS) buscket.push(bookFromOPDS);
        //if(bookFromOPDS) Books.insertOne(bookFromOPDS);
      }
    }
    await Books.insertMany(basket)
    return  idOfBooks;
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
    const booksId = await checkAddToDb(list);

    Array.isArray(booksId) && booksId.length > 0 && Lists.updateOne({_id:`1_${listId}`},{_id:`1_${listId}`, lib_id:1, name: `popular ${listId}`, data: booksId, updatedAt: new Date() }, {upsert: true});

  };

  getList();
}
