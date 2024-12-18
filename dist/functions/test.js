exports = async () => {
  const { getText, xmlParser, getLibrary, fillGenres, getBooksNotInDb, getGenresId } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const Genres = context.services.get("mongodb-atlas").db("flibusta").collection("Genres");
  
  const genres = [
  ['Хобби и ремесла', 'Здоровье', 'Сад и огород'],
  ['Сделай сам', 'Боевые искусства, спорт'],
  ['Домоводство', 'Коллекционирование']
]
  const {performance} = require('perf_hooks');
  //const genres1 = await Genres.find({ title: { $in: genres[0].concat(genres[1], genres[2]) } }).toArray()
  const start = performance.now();
  console.log(JSON.stringify(await getGenresId(['Хобби и ремесла', 'Здоровье', 'Сад и огород'])))
    const end = performance.now();

    // Переводим в секунды
    const diffSec = (end - start) / 1000;
    
    console.log('diffSec', diffSec)
  //const _genres = context.values.get("genres");
  //const genres = new Map(_genres);
  //const books = await Books.find({date: {$gt: new Date("2023-04-01T00:00:00.000Z")}}).toArray();

  //onst res = fillGenres(books);

  //return books
  //const book = await Books.updateMany({expires: {$ne: null}}, {$set: {expires: null}})
  
  //console.log(JSON.stringify(book));
  
  
  
  
};
