const getFile = async({url, _id})=> {
  try{
    const response = await context.http.get({url});
    const _headers = response.headers;
    const headers = Object.keys(_headers).reduce((item,key)=>{item[key]= Array.isArray(_headers[key])? _headers[key][0] : _headers[key]; return item;},{});
    return {_id, headers, body: response.body};
  }catch(e){
    return null;
  }

}


const saveFile = async (file)=> {
  const files = context.services.get("mongodb-atlas").db("flibusta").collection("Files");
  return await files.inserOne(file);

};

exports = async function(book){
  const file = await getFile(book);
  return await saveFile(file)
  /*
    Accessing application's values:
    var x = context.values.get("value_name");

    Accessing a mongodb service:
    var collection = context.services.get("mongodb-atlas").db("dbname").collection("coll_name");
    collection.findOne({ owner_id: context.user.id }).then((doc) => {
      // do something with doc
    });

    To call other named functions:
    var result = context.functions.execute("function_name", arg1, arg2);

    Try running in the console below.
  */
  return {arg: arg};
};