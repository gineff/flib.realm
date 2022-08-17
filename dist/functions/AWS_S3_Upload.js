const aws = async ()=> {
  const AWS = require('aws-sdk');
  const ep = new AWS.Endpoint('hb.bizmrg.com');
  const credentials = {accessKeyId: context.values.get("AWS_AccessKeyID"), secretAccessKey: context.values.get("AWS_SecretKey")};
  const s3 = new AWS.S3({endpoint: ep, apiVersion: '2006-03-01', credentials});
  return s3;
}

exports = function(changeEvent) {
  const axios = require("axios").default;

  //context.http.get("flibusta.site/i/44/680744/img_0.jpeg")
  const {documentKey, fullDocument, updateDescription} = changeEvent;
  console.log("documentKey", JSON.stringify(documentKey));
  console.log("fullDocument", JSON.stringify(fullDocument));
  console.log("updateDescription", JSON.stringify(updateDescription));


  // /books
  // /images small big
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
