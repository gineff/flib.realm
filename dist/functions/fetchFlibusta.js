//test
exports = async () => {
  const { getText, xmlParser } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  const getUrl = (page) => `https://flibusta.is/opds/new/${page}/new`;

  async function* fetchBooks() {
    let page = 0;
    let url = getUrl(page);

    while (url) {
      const xml = await getText(fetchUrl);
      const json = xmlParser(xml);
      for (const book of json) {
        yield book;
      }

      page += 1;
      url = getUrl(page);
    }
  }

  for await (const book of fetchBooks()) {
    try {
      Books.insert(book);
    } catch (error) {
      console.error(error);
      break;
    }
  }
};
