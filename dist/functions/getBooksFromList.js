/* eslint-disable no-param-reassign */
function plus90Days(date) {
  const current = date instanceof Date ? date : new Date(date)
  current.setDate(current.getDate() + 90)
  return current
}

exports = arg => {
  //** context - глобальная переменная */
  const { getText, htmlParser, xmlParser } =
    context.functions.execute('mainFunctions')

  class ListParser {
    constructor(listId = 'w') {
      if (ListParser._instance) {
        return ListParser._instance
      }
      ListParser._instance = this

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
          const now = new Date()
          now.setHours(now.getHours() + 12)
          this.extendS3ExpirationDate(booksInDb, now)
          return booksFrameNotInDb
        })
        .then(booksFrameNotInDb => this.findNewBooksInOPDS(booksFrameNotInDb))
        .then(booksNotInDb => this.addBooksToDb(booksNotInDb))
        .then(booksAddedToDb => this.preparelist(booksAddedToDb))
        .then(list => this.updateList(list))
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
      this.booksInDb = booksInDb
      return [booksInDb, booksFrameNotInDb]
    }
    async extendS3ExpirationDate(booksInDb, now) {
      const booksIdExpired = booksInDb.reduce((arr, book) => {
        const bookDateExpires =
          (book.expires && new Date(book.expires)) || plus90Days(book.date)
        if (now.getTime() >= bookDateExpires.getTime()) {
          arr.push(book._id)
        }
        return arr
      }, [])
      console.log('booksExpired length: ', booksIdExpired.length)

      await this.Books.updateMany(
        { _id: { $in: booksIdExpired } },
        { $set: { expires: new Date(plus90Days(now).getTime()) } }
      )
    }
    async findNewBooksInOPDS(booksFrameNotInDb) {
      const basket = []
      for (const booksFrame of booksFrameNotInDb) {
        console.log('book Not In Db', JSON.stringify(booksFrame.title))
        basket.push(this.searchBookByAuthor(booksFrame))
      }
      return await Promise.all(basket)
    }
    async getAuthorUrl(authorId, searchPage) {
      return `http://flibusta.is/opds/author/${authorId}/time/${searchPage - 1}`
    }
    async fetchBooksList(url) {
      const text = await getText(url)
      return xmlParser(text)
    }
    async searchBookByAuthor(book, searchPage = 1) {
      try {
        const authorId = book.author[0]?.id
        if (!authorId) return undefined

        const authorUrl = await this.getAuthorUrl(authorId, searchPage)
        const booksList = await this.fetchBooksList(authorUrl)

        const foundBook = booksList.find(bookItem => bookItem.bid === book.bid)
        if (booksList.length === 20 && !foundBook) {
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
      booksNotInDb.forEach((item, i) => (item._id = insertedIds[i]))
      return booksNotInDb
    }
    async preparelist(booksAddedToDb) {
      const hash = {}
      this.bidArray.forEach((bid, i) => (hash[bid] = i))
      const allBooks = this.booksInDb.concat(booksAddedToDb)
      const sortedBooks = allBooks.sort((a, b) => hash[a.bid] - hash[b.bid])
      return sortedBooks.map(({ _id }) => _id)
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
