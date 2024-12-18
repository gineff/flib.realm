/* eslint-disable no-await-in-loop */
exports = async () => {
  const { getText, xmlParser } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");

  async function* fetchBooks() {
    let page = 0;
    let url = `https://flibusta.is/opds/new/${page}/new`;

    while (url) {
      const xml = await getText(fetchUrl);
      const json = xmlParser(xml);
      for (const book of json) {
        yield book;
      }

      page += 1;
      url = `https://flibusta.is/opds/new/${page}/new`;
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
