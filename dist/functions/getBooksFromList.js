const {getText, htmlParser, getCollection, getLibraryUrl} =  context.functions.execute("mainFunctions");
const Lists = getCollection('flibusta',"Lists");
const Books = getCollection('flibusta',"Books");
let url;

const xmlParser = (text)=> {
  return context.functions.execute("xmlParserFlibusta", text);
};

const checkAddToDb = async (books)=> {

  const idOfBooks =  books.map(el=>el.bid);
  const booksInDb = await Books.find({bid: {$in: idOfBooks}},{bid:1}).toArray();
  const booksIDInDb= booksInDb.map(el=>el.bid);

  for(let book of books){
    if(!booksIDInDb.includes(book.bid)){
      console.log("book Not In Db", JSON.stringify(book.title));
      const bookFromOPDS = await searchBookByAuthor(book);
      if(bookFromOPDS) Books.insertOne(bookFromOPDS);
    }
  }

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

  Lists.updateOne({_id:`1_${listId}`},{_id:`1_${listId}`, lib_id:1, name: `popular ${listId}`, data: booksId, updatedAt: new Date() }, {upsert: true});

  /*

    const booksId = await checkAddToDb(list);

    lists.updateOne({_id:`1_${listId}`},{_id:`1_${listId}`, lib_id:1, name: `popular ${listId}`, data: booksId, updatedAt: new Date() }, {upsert: true});
  */
};

exports = getList;
