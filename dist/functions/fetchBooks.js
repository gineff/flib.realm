/* eslint-disable no-await-in-loop */
exports = async () => {
  const { getText, xmlParser, getLibrary, fillGenres, getBooksNotInDb } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  const fetchBooks = async (lib, page) => {
    const fetchUrl = `http://${  lib.url  }${lib.fetchUrl.replace("$page", page)}`;
    const xml = await getText(fetchUrl);
    return fillGenres(xmlParser(xml));
  };

  const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const page of arr) {
    const books = await fetchBooks(await getLibrary({ _id: 1 }), page);
    const BooksNotInDb = await getBooksNotInDb(books);
    if (BooksNotInDb.length > 0) await Books.insertMany(BooksNotInDb);
    if (BooksNotInDb.length !== books.length) break;
  }
};
