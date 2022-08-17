

exports = async function(changeEvent) {
  const {aws} =  context.functions.execute("mainFunctions");
  const axios = require("axios").default;
  const proxyImageUrl ="https://images.weserv.nl/?url=";
  //return proxyImageUrl+ "http://flibusta.is" + cover +"&h=500" ;

  const {fullDocument} = changeEvent;
  const {_id,image} = fullDocument;
  const s3 = await aws();


  const  uploadStream = async(params) => {
    const pass = new stream.PassThrough();
    await s3.upload(params)
    return pass;
  }


  if(image){
    const imageName = image.split("/")[4];
    const response = await axios.get(url, {responseType: "stream"});
    const ContentType = response.headers["content-type"] ||  "image/jpeg";
    const params = {Bucket: "flib.s3", Key: `${_id}/${imageName}`, ContentType};
    response.data.pipe(await uploadStream())

  }


  s3.upload (params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } if (data) {
      console.log("Upload Success", data.Location);
    }
  });
  /*
    A Database Trigger will always call a function with a changeEvent.
    Documentation on ChangeEvents: https://docs.mongodb.com/manual/reference/change-events/

    Access the _id of the changed document:
    const docId = changeEvent.documentKey._id;

    Access the latest version of the changed document
    (with Full Document enabled for Insert, Update, and Replace operations):
    const fullDocument = changeEvent.fullDocument;

    const updateDescription = changeEvent.updateDescription;

    See which fields were changed (if any):
    if (updateDescription) {
      const updatedFields = updateDescription.updatedFields; // A document containing updated fields
    }

    See which fields were removed (if any):
    if (updateDescription) {
      const removedFields = updateDescription.removedFields; // An array of removed fields
    }

    Functions run by Triggers are run as System users and have full access to Services, Functions, and MongoDB Data.

    Access a mongodb service:
    const collection = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
    const doc = collection.findOne({ name: "mongodb" });

    Note: In Atlas Triggers, the service name is defaulted to the cluster name.

    Call other named functions if they are defined in your application:
    const result = context.functions.execute("function_name", arg1, arg2);

    Access the default http client and execute a GET request:
    const response = context.http.get({ url: <URL> })

    Learn more about http client here: https://docs.mongodb.com/realm/functions/context/#context-http
  */
};
