const getFb2Url = (downloads) => downloads?.find((el) => el.type === "application/fb2+zip")?.href;

exports = async function uploadBooks(changeEvent) {
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const { fullDocument, operationType, updateDescription = {} } = changeEvent;
  const { _id, image } = fullDocument;

  const { aws, Params, FileStreamParams, ImageStreamParams } = context.functions.execute("aws");
  const axios = require("axios").default;
  const stream = require("stream");
  const clientS3 = await aws();

  if (
    operationType === "insert" ||
    (operationType === "update" && updateDescription?.updatedFields?.expires)
  ) {
    clientS3.upload(
      new Params({
        catalog: _id,
        fileName: "book.json",
        contentType: "application/json",
        body: JSON.stringify(fullDocument),
      }).values,
      (err, data) => err && console.log(err, JSON.stringify(data))
    );

    if (image) {
      clientS3.upload(
        (
          await new ImageStreamParams({
            catalog: _id,
            height: 167,
            axios,
            stream,
            url: image,
          }).pipe()
        ).values,
        (err, data) => err && console.log(err, JSON.stringify(data))
      );

      clientS3.upload(
        (
          await new ImageStreamParams({
            catalog: _id,
            height: 700,
            axios,
            stream,
            url: image,
          }).pipe()
        ).values,
        (err, data) => err && console.log(err, JSON.stringify(data))
      );
    }

    const fb2AttachmentUrl = getFb2Url(downloads);
    let fb2FileName;

    if (fb2AttachmentUrl) {
      const fb2 = await new FileStreamParams({
        catalog: _id,
        axios,
        stream,
        url: fb2AttachmentUrl,
      }).pipe();

      fb2FileName = fb2.fileName;

      clientS3.upload(fb2.values, (err, data) => err && console.log(err, JSON.stringify(data)));
    }

    Books.updateOne({ _id }, { $set: { s3: true, ...(fb2FileName ? { fb2FileName } : {}) } });
  }
};
