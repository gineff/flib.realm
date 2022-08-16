exports = () => {
  const {getText, htmlParser, xmlParser, getLibraryUrl} =  context.functions.execute("mainFunctions");
  const Lists = context.services.get("mongodb-atlas").db("flibusta").collection("Lists");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  let url;

  const checkAddToDb = async books => {

    const idOfBooks =  books.map(el=> el.bid);
    const booksInDb = await Books.find({lid: 1, bid: {$in: idOfBooks}},{bid:1}).toArray();
    const booksIDInDb= booksInDb.map(el=>el.bid);
    const basket = [];

    for(let book of books){
      if(!booksIDInDb.includes(book.bid)){
        console.log("book Not In Db", JSON.stringify(book.title));
        const bookFromOPDS = await searchBookByAuthor(book);
        if(bookFromOPDS) basket.push(bookFromOPDS);
      }
    }
    basket.length && await Books.insertMany(basket,
      {ordered: false, silent: true}).catch(e=> console.log(e));
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
    const booksBid = await checkAddToDb(list);
    if(Array.isArray(booksBid) && booksBid.length){
      const books_id = (await Books.find({lid:1, bid:{$in: booksBid}},{_id: 1}).toArray()).map(el=> el._id)

      Lists.updateOne({_id:`1_${listId}`},
        {_id:`1_${listId}`,
          lib_id:1,
          name: `popular ${listId}`,
          data: books_id,
          updatedAt: new Date()},
        {upsert: true});
    }
  };

  getList();
}
