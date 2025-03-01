async function getText(url) {
  return (await context.http.get({ url })).body.text() || "";
}

const getOpds = async (url) => {
  const response = await context.http.get({ url });
  return response.body.text();
};

const xmlParser = (text) => context.functions.execute("xmlParserFlibusta", text);

const htmlParser = (type, text) => {
  const matchAll = require("string.prototype.matchall");
  if (type === "List") {
    const matches = Array.from(matchAll(text, /<a href="\/a\/(.*?)">(.*?)<\/a> - <a href="\/b\/(.*?)">(.*?)<\/a>/g));
    return matches.map((el) => ({
      bid: el[3],
      author: [{ name: el[2], id: el[1] }],
      title: el[4],
      sequencesTitle: [],
    }));
  }
  return [];
};

const getCollection = (db, name) => context.services.get("mongodb-atlas").db(db).collection(name);

const getLibrary = async (query) => {
  const libraries = getCollection("flibusta", "Libraries");
  try {
    return libraries.findOne(query);
  } catch (e) {
    return false;
  }
};

const getLibraryUrl = async (query) => {
  const { url } = await getLibrary(query);
  return url;
};

const getBooksNotInDb = async (books) => {
  const Books = getCollection("flibusta", "Books");
  const idOfBooks = books.map((el) => el.bid);
  const booksInDb = await Books.find({ lid: 1, bid: { $in: idOfBooks } }, { bid: 1, _id: 0 }).toArray();
  const booksIDInDb = booksInDb.map((el) => el.bid);
  const booksNotInDb = books.filter((el) => !booksIDInDb.includes(el.bid));
  console.log("booksNotInDb length: ", booksNotInDb.length);
  return booksNotInDb;
};

const aws = async () => {
  const AWS = require("aws-sdk");
  const ep = new AWS.Endpoint("hb.bizmrg.com");
  const credentials = {
    accessKeyId: context.values.get("AWS_AccessKeyID"),
    secretAccessKey: context.values.get("AWS_SecretKey"),
  };
  return new AWS.S3({ endpoint: ep, apiVersion: "2006-03-01", credentials });
};

exports = () => ({
  getText,
  getOpds,
  xmlParser,
  htmlParser,
  getLibrary,
  aws,
  getLibraryUrl,
  getBooksNotInDb,
});
