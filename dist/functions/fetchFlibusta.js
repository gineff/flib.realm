exports = async () => {
  const { getText, xmlParser } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  async function* fetchBooks() {
    const getUrl = (page) => `https://flibusta.is/opds/new/${page}/new`;

    let page = 0;

    while (true) {
      const url = getUrl(page);
      const xml = await getText(url);

      if (!xml) {
        break;
      }

      const json = xmlParser(xml);

      if (!json || json.length === 0) {
        break;
      }

      for (const book of json) {
        yield book;
      }

      page += 1;
    }
  }

  for await (const book of fetchBooks()) {
    try {
      const existingBook = await Books.findOne({ bid: book.bid });

      if (!existingBook) {
        await Books.insertOne(book);
        console.log(`Добавлена книга: ${book.bid}`);
      } else {
        break;
      }
    } catch (error) {
      console.error(`Ошибка при обработке книги "${book.bid}":`, error);
      break;
    }
  }
};
