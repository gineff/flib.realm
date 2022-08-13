const getLists = async ()=> {
  const collection = context.services.get("mongodb-atlas").db("flibusta").collection("Lists");
  const lists = await collection.find().toArray();
  return lists;
}

const encode = (array)=> {
  const str = JSON.stringify(array);
  return Buffer.from(str, 'binary').toString('base64')
}



const update = async(base64_str)=> {
  const {Octokit} = require("octokit");
  const key = await context.values.get("ApiKey");
  const octokit = new Octokit({auth: key})
  

   const  {data:{sha}}  = await octokit.request('GET /repos/gineff/flibweb/contents/db/lists.json',{
    auth: key,
    owner: 'gineff',
    repo: 'flibweb',
    ref: 'pages',
    path: '/db/lists.json'
  });

  return await octokit.request('PUT https://api.github.com/repos/gineff/flibweb/contents/db/lists.json', {
    owner: 'gineff',
    repo: 'flibweb',
    branch: 'pages',
    path: '/db/lists.json',
    message: 'my commit message',
    committer: {
      name: 'Anri',
      email: 'canone@inbox.ru'
    },
    sha,
    content: base64_str
  })

}

const main = async ()=> {
  const lists = await getLists();
  const base64_str = encode(lists);
  console.log(JSON.stringify(await update(base64_str)));
}

exports = function() {
  main();
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
};
