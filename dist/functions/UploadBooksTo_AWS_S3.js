
exports = async function(changeEvent) {
  const {aws, getLibraryUrl} =  context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const axios = require("axios").default;
  const stream = require("stream");

  const {fullDocument} = changeEvent;
  const {_id, image, downloads} = fullDocument || await Books.findOne({_id: new BSON.ObjectId(changeEvent)});
  const s3 = await aws();
  const libUrl = await getLibraryUrl({_id: 1});
  const proxyImageUrl ="https://images.weserv.nl/?url=";

  const  uploadStream = async(url, Key) => {
    const pass = new stream.PassThrough();
    try{
      const response = await axios.get(url, {responseType: "stream"});
      response.data.pipe(pass);
    }catch (e) {
      console.log(e);
    }


    const ContentType = response.headers["content-type"] ||  "octet-stream";
    //Key при загрузке файла fb2
    Key = Key || _id+"/"+response.headers["content-disposition"]?.split("=")[1]?.replace("\"","");
    const params = {Bucket: "flib.s3", Key, ContentType, Body: pass};

    await s3.upload(params, (err, data)=> {
      console.log("stream error", err);
      console.log(data?.Location);
    })
  }

  await s3.upload({Bucket: "flib.s3", Key: `${_id}/book.json`, ContentType: "application/json", Body: JSON.stringify(fullDocument)},
    (err, data)=> {
    console.log("book",err);
    console.log(data?.Location);
  })


  if(image){
    const imageName = image.split("/")[4];
    const imageHeights = [167,500];
    for(let h of imageHeights) {
      const url = proxyImageUrl+`http://${libUrl}${image}&h=${h}`;
      const Key = `${_id}/${h}-${imageName}`;
      await uploadStream(url, Key);
    }
  }

  if(downloads) {
    const href = downloads.filter(el=> el.type === "application/fb2+zip")[0]?.href;
    if(href) {
      const url = `http://${libUrl}${href}`;
      await uploadStream(url);
    }
  }

  Books.updateOne({_id},{$set:{s3: true}});
};
