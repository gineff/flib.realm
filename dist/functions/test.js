exports = async () => {
  const { getText, xmlParser, getLibrary, fillGenres, getBooksNotInDb } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const _genres = context.values.get("genres");
  const genres = new Map(_genres);
  const books = await Books.find({date: {$gt: new Date("2021-12-11T00:00:00.000Z")}}).toArray();

  const res = fillGenres(books);

  console.log(JSON.stringify(books.length));
};
