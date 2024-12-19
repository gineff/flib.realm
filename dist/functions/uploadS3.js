const getFb2Url = (downloads) => downloads?.find((el) => el.type === "application/fb2+zip")?.href;

exports = async function uploadBooks(changeEvent) {
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const { fullDocument, operationType, updateDescription = {} } = changeEvent;
  const { _id, fb2FileName, expires, image } = fullDocument;

  const { aws, Params, FileStreamParams, ImageStreamParams } = context.functions.execute("aws");
  const axios = require("axios").default;
  const stream = require("stream");
  const clientS3 = await aws();

  if (operationType === "insert") {
    clientS3.upload(
      new Params({
        catalog: _id,
        fileName: "book.json",
        contentType: "application/json",
        body: JSON.stringify(fullDocument),
      }).values
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
        ).values
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
        ).values
      );
    }

    const fb2AttachmentUrl = getFb2Url(downloads);
    let fb2FileName;

    if (fb2AttachmentUrl) {
      const fb2 = await new FileStreamParams({
        catalog: _id,
        axios,
        stream,
        url: getFb2Url(downloads),
      }).pipe();

      fb2FileName = fb2.fileName();

      clientS3.upload(fb2.values);
    }

    Books.updateOne({ _id }, { $set: { s3: true, ...(fb2FileName ? { fb2FileName } : {}) } });
  }
};
