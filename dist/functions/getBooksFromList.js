/* eslint-disable no-param-reassign */
exports = arg => {
  const {
    getText,
    htmlParser,
    xmlParser,
    fillGenres,
    getLibraryUrl,
    getBooksNotInDb,
  } = context.functions.execute('mainFunctions')
  const Lists = context.services
    .get('mongodb-atlas')
    .db('flibusta')
    .collection('Lists')
  const Books = context.services
    .get('mongodb-atlas')
    .db('flibusta')
    .collection('Books')
  let url

  const searchBookByAuthor = async (book, searchPage = 1) => {
    try {
      if (!book.author[0].id) return undefined
      const text = await getText(
        `http://${url}/opds/author/${book.author[0].id}/time/${searchPage - 1}`
      )
      const data = await fillGenres(xmlParser(text))
      const filteredData = data.filter(el => el.bid === book.bid)[0]
      if (data.length === 20 && filteredData === undefined) {
        // eslint-disable-next-line no-plusplus
        return searchBookByAuthor(book, ++searchPage)
      }
      return filteredData
    } catch (e) {
      console.log('searchBookByAuthor error', e)
    }
  }

  const checkAddToDb = async books => {
    try {
      const BooksNotInDb = await getBooksNotInDb(books)
      const basket = []

      for (const book of BooksNotInDb) {
        console.log('book Not In Db', JSON.stringify(book.title))
        basket.push(searchBookByAuthor(book))
      }
      await Promise.all(basket)

      if (basket.length) {
        const { insertedIds } = await Books.insertMany(basket, {
          ordered: false,
          silent: true,
        })
        return insertedIds
      }
    } catch (e) {}

    return []
  }

  async function getList(listId) {
    try {
      listId = listId === 'w' || listId === '24' ? listId : 'w'

      url = await getLibraryUrl({ _id: 1 })
      const text = await getText(`http://${url}/stat/${listId}`)
      const list = htmlParser('List', text)
      await checkAddToDb(list)
      const bidOfBooks = list.map(el => el.bid)
      const idOfBooks = await Books.find(
        { lid: 1, bid: { $in: bidOfBooks } },
        { _id: 1 }
      ).toArray()
      if (Array.isArray(idOfBooks) && idOfBooks.length) {
        Lists.updateOne(
          { _id: `1_${listId}` },
          {
            _id: `1_${listId}`,
            lib_id: 1,
            name: `popular ${listId}`,
            data: idOfBooks,
            updatedAt: new Date(),
          },
          { upsert: true }
        )
      }
    } catch (e) {
      console.log('getList error', e)
    }
  }

  getList(arg)
}
