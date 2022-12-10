const getList = async function () {
  const libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Libraries");

  const lib = await libraries.findOne({ _id: 1 });
  const lists = ["w", "24"];
  let set = new Set();
  lists.forEach((el) => {
    set = new Set([...set, ...lib[`list-${el}`]]);
  });
  return set;
};

exports = async function () {
  const start = new Date();
  const collection = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const books = await getList();

  for (const bookId of books) {
    const comments = await context.functions.execute("getRatingNComments", bookId);
    const res = await collection.updateOne({ lid: 1, bid: bookId }, { $set: { ...comments } });
    // console.log(bookId, JSON.stringify(comments));
    // console.log(bookId, JSON.stringify(res));
  }
  console.log("total time spent", new Date() - start);
};
