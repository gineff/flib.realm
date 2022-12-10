/* eslint-disable no-param-reassign */
const axios = require("axios").default;
const stream = require("stream");

exports = async function uploadBooks(changeEvent) {
  const { aws, getLibraryUrl } = context.functions.execute("mainFunctions");
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");


  let fb2FileName;
  let { fullDocument } = changeEvent;
  fullDocument = fullDocument || (await Books.findOne({ _id: new BSON.ObjectId(changeEvent) }));
  const { _id, image, downloads } = fullDocument;
  const s3 = await aws();
  const libUrl = await getLibraryUrl({ _id: 1 });
  const proxyImageUrl = "https://images.weserv.nl/?url=";

  const uploadStream = async (url, Key) => {
    const pass = new stream.PassThrough();
    let response;
    try {
      response = await axios.get(url, { responseType: "stream" });
      response.data.pipe(pass);
    } catch (e) {
      console.log(e);
    }

    const ContentType = response.headers["content-type"] || "octet-stream";
    // Key при загрузке файла fb2
    if (!Key) {
      // eslint-disable-next-line no-useless-escape
      fb2FileName = response.headers["content-disposition"]?.split("=")[1]?.replace(/\"/g, "");
      Key = `${_id}/${fb2FileName}`;
    }

    const params = { Bucket: "flib.s3", Key, ContentType, Body: pass };

    await s3.upload(params, (err, data) => {
      console.log("stream error", err);
      console.log(data?.Location);
    });
  };

  if (downloads) {
    const href = downloads.filter((el) => el.type === "application/fb2+zip")[0]?.href;
    if (href) {
      const url = `http://${libUrl}${href}`;
      await uploadStream(url);
    }
  }

  if (fb2FileName) {
    fullDocument.fb2FileName = fb2FileName;
  }

  await s3.upload(
    { Bucket: "flib.s3", Key: `${_id}/book.json`, ContentType: "application/json", Body: JSON.stringify(fullDocument) },
    (err, data) => {
      console.log("book", err);
      console.log(data?.Location);
    }
  );

  const results = [];
  if (image) {
    const imageName = image.split("/")[4];
    const imageHeights = [167, 500];
    for (const h of imageHeights) {
      const url = `${proxyImageUrl}http://${libUrl}${image}&h=${h}`;
      const Key = `${_id}/${h}-${imageName}`;
      results.push(uploadStream(url, Key));
    }
  }
  await Promise.all(results);

  const update = fb2FileName ? { s3: true, fb2FileName } : { s3: true };

  Books.updateOne({ _id }, { $set: update });
};
