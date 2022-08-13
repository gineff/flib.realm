exports = async function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://docs.mongodb.com/realm/triggers/overview/

    Functions run by Triggers are run as System users and have full access to Services, Functions, and MongoDB Data.

    Access a mongodb service:
    const collection = context.services.get(<SERVICE_NAME>).db("<DB_NAME>").collection("<COLL_NAME>");
    const doc = collection.findOne({ name: "mongodb" });

    Note: In Atlas Triggers, the service name is defaulted to the cluster name.

    Call other named functions if they are defined in your application:
    const result = context.functions.execute("function_name", arg1, arg2);

    Access the default http client and execute a GET request:
    const response = context.http.get({ url: <URL> })

    Learn more about http client here: https://docs.mongodb.com/realm/functions/context/#context-http
  */

  const collection = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const Libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Libraries");

  const getOpds = async (url)=> {
    const response = await context.http.get({url});
    return response.body.text();
  };

  const getBooks = async (url)=> {
    const opds = await getOpds(url);
    //console.log(opds);
    const books = context.functions.execute("xmlParserFlibusta", opds);
    return  books;
  };



  const updateLibrary = async (lib, page)=> {
    
   const fetchUrl = lib.url+lib.fetchUrl.replace("$page",page);
   console.log(fetchUrl);
   const books = await  getBooks(fetchUrl);
   const now = new Date();
   books.forEach(el=>{el._id=lib._id+"_"+el.bid, el.lid = lib._id, el.date = now; /*console.log(JSON.stringify({_id:el._id, lid: el.lid, title: el.title.slice(0,10)}))*/});
   //console.log(JSON.stringify(books.map(el=>({_id:el._id, lid: el.lid, title: el.title.slice(0,10)}))));
    //const books = await  getBooks("http://flibusta.is/opds/new/"+page+"/new");
   const BookWithMinId = books[books.length-1];
   const result = await collection.findOne({_id:BookWithMinId._id});

    try {
      await collection.insertMany(books);
    }catch(e){
      console.log("error",JSON.stringify(e))
    }
    console.log("page", page)
    //console.log('result', JSON.stringify(result));

    if(!result && page<10) {
      updateLibrary(lib, ++page);
    }

  };

  //updateLibrary(page);
  
    const libraries = await Libraries.find().toArray();
    updateLibrary(libraries[0], 0);
    //console.log(JSON.stringify(libraries));
  /*  for(let lib of libraries){
      //console.log(JSON.stringify(lib));
      await updateLibrary(lib, 0);
    }*/

};