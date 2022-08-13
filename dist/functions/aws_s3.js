const aws = async ()=> {
  const AWS = require('aws-sdk');
  const ep = new AWS.Endpoint('hb.bizmrg.com');
  //const credentials = new AWS.credentials('t84umK9to7GTZ71UzKaNhb','cHfy3YUnHh7hPnNpTwGqFrgbzMxcgwtddiBectrw7Byf');
  const s3 = new AWS.S3({endpoint: ep, apiVersion: '2006-03-01', credentials: {accessKeyId: 't84umK9to7GTZ71UzKaNhb',secretAccessKey: 'cHfy3YUnHh7hPnNpTwGqFrgbzMxcgwtddiBectrw7Byf'}});
  //s3.service.endpoint.hostname == 'awsproxy.example.com'

  //const bucketName = 'flib.s3.hb.bizmrg.com';
  //console.log(JSON.stringify(AWS.config));

  s3.listBuckets(function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", JSON.stringify(data.Buckets));
    }
  });
/*
  const  bucket = new AWS.S3({ params: {Bucket: bucketName}, apiVersion: '2006-03-01' });
//  const bucket = await new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName});
  const file = await bucket.getObject({Key: 'list.json'});
  bucket.listObjects.on('success',function handlePage(response)  {res.data})
 */
}

exports = function(arg){

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
  //console.log(context.values.get("gitHubApiKey"))
  //aws();
  //return {arg: arg};
};
