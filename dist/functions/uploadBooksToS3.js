const getFb2Url = (downloads) => downloads?.find((el) => el.type === "application/fb2+zip")?.href;

const upload = (s3, params) => {
  s3.upload(params, (err, data) => err && console.log(err, JSON.stringify(data)));
};

exports = async function uploadBooks(changeEvent) {
  const { fullDocument, operationType, updateDescription = {} } = changeEvent;
  const { _id, image, downloads } = fullDocument;

  const { aws, Params, FileStreamParams, ImageStreamParams } = context.functions.execute("aws");
  const axios = require("axios").default;
  const stream = require("stream");
  const clientS3 = await aws();

  if (
    operationType === "insert" ||
    (operationType === "update" && updateDescription?.updatedFields?.expires)
  ) {
    const options = { catalog: _id, axios, stream };

    upload(
      clientS3,
      new Params({
        catalog: _id,
        fileName: "book.json",
        contentType: "application/json",
        body: JSON.stringify(fullDocument),
      }).values
    );

    if (image) {
      upload(
        clientS3,
        await new ImageStreamParams(Object.assign(options, { height: 167, url: image })).pipe()
          .values
      );
      upload(
        clientS3,
        await new ImageStreamParams(Object.assign(options, { height: 700, url: image })).pipe()
          .values
      );
    }

    let fb2AttachmentUrl;

    if ((fb2AttachmentUrl = getFb2Url(downloads))) {
      upload(
        clientS3,
        await new FileStreamParams(Object.assign(options, { url: fb2AttachmentUrl })).pipe().values
      );
    }
  }
};
