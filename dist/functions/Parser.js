/* eslint-disable no-param-reassign */
function plus90Days(date) {
  const current = new Date(date)
  current.setDate(current.getDate() + 90)
  return current
}

exports = arg => {
  //** context - глобальная переменная */
  const { getText, htmlParser, xmlParser, fillGenres } =
    context.functions.execute('mainFunctions')

  class ListParser {
    constructor(listId = 'w') {
      this.listId = listId
      this.Books = context.services
        .get('mongodb-atlas')
        .db('flibusta')
        .collection('Books')
      this.List = context.services
        .get('mongodb-atlas')
        .db('flibusta')
        .collection('Lists')

      this.libUrl = `http://flibusta.is/stat/${listId}`
      this.parse()
        .then(booksFrame => this.compareWithBooksInDB(booksFrame))
        .then(([booksInDb, booksFrameNotInDb]) => {
          this.extendS3ExpirationDate(booksInDb)
          return booksFrameNotInDb
        })
        .then(booksFrameNotInDb => this.findNewBooksInOPDS(booksFrameNotInDb))
        //.then(booksNotInDb => this.addBooksToDb(booksNotInDb))
        //.then(_ => this.preparelist())
        //.then(list => this.updateList(list))
    }
    async parse() {
      const text = await getText(this.libUrl)
      return htmlParser('List', text)
    }
    async compareWithBooksInDB(booksFrame) {
      this.bidArray = booksFrame.map(el => el.bid)
      const booksInDb = await this.Books.find(
        { lid: 1, bid: { $in: this.bidArray } },
        { bid: 1, date: 1, expires: 1 }
      ).toArray()
      const booksIdSet = new Set(booksInDb.map(el => el.bid))
      const booksFrameNotInDb = booksFrame.filter(el => !booksIdSet.has(el.bid))
      console.log('booksNotInDb length: ', booksFrameNotInDb.length)
      return [booksInDb, booksFrameNotInDb]
    }
    async extendS3ExpirationDate(booksInDb) {
      const now = Date.now()
      const halfDay = 60 * 60 * 12
      const booksNeedToExtend = booksInDb.filter(book => {
        const expires = book.expires || plus90Days(book.date)
        return now - halfDay > expires
      })
      console.log(JSON.stringify(booksNeedToExtend.map(book => book.date)))
    }
    async findNewBooksInOPDS(booksFrameNotInDb) {
      const basket = []
      for (const booksFrame of booksFrameNotInDb) {
        console.log('book Not In Db', JSON.stringify(booksFrame.title))
        basket.push(this.searchBookByAuthor(booksFrame))
      }
      return await Promise.all(basket)
    }
    async searchBookByAuthor(book, searchPage = 1) {
      try {
        if (!book.author[0].id) return undefined
        const text = await getText(
          `http://flibusta.is/opds/author/${book.author[0].id}/time/${
            searchPage - 1
          }`
        )
        const books = await fillGenres(xmlParser(text))
        const foundBook = books.find(el => el.bid === book.bid)
        if (books.length === 20 && foundBook === undefined) {
          return this.searchBookByAuthor(book, ++searchPage)
        }
        return foundBook
      } catch (e) {
        console.log('searchBookByAuthor error', e)
      }
    }
    async addBooksToDb(booksNotInDb = []) {
      if (!booksNotInDb.length) return []
      const { insertedIds } = await this.Books.insertMany(booksNotInDb, {
        ordered: false,
        silent: true,
      })
      return insertedIds
    }
    async preparelist() {
      const books = await this.Books.find(
        { lid: 1, bid: { $in: this.bidArray } },
        { _id: 1 }
      ).toArray()
      return books.map(book => book._id)
    }
    async updateList(list = []) {
      if (!list.length) return false
      await this.List.updateOne(
        { _id: `1_${this.listId}` },
        {
          _id: `1_${this.listId}`,
          lib_id: 1,
          name: `popular ${this.listId}`,
          data: list,
          updatedAt: new Date(),
        },
        { upsert: true }
      )
    }
  }

  new ListParser(arg)
}
