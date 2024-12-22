exports = async () => {
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  //const { getText } = context.functions.execute("mainFunctions");
  const s3 = "http://flib.s3.hb.ru-msk.vkcloud-storage.ru";
  const url = `${s3}/lists/1_new.json`;
  try {
    const list = await context.http.get({ url }).body.json();
    console.log(list);
  } catch (e) {
    console.log(e);
  }
};
