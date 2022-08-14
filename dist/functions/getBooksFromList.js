

const getList  = async function(listId) {

  const {getText} =  context.functions.execute("mainFunctions");
  console.log(await getText("http://flibusta.is"));
/*
  listId = (listId === "w" || listId === "24")? listId : "w";
  const lists = context.services.get("mongodb-atlas").db("flibusta").collection("Lists");
  const siteStatus = await context.functions.execute("checkLibrarySiteStatus", {_id: 1})


  const text = await context.functions.execute("getText", url);
  const list = await htmlParser(text);
  const booksId = await checkAddToDb(list);

  lists.updateOne({_id:`1_${listId}`},{_id:`1_${listId}`, lib_id:1, name: `popular ${listId}`, data: booksId, updatedAt: new Date() }, {upsert: true});
*/
};

exports = getList;
