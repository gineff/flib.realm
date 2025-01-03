function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

class Params {
  constructor({
    prefix = "books",
    catalog = "",
    fileName = "",
    body = "",
    contentType = "text/plain",
  }) {
    this.ACL = "public-read";
    this.Bucket = "flib.s3";
    this.prefix = prefix;
    this.Body = body;
    this.ContentType = contentType;
    this.catalog = catalog;
    this.fileName = fileName;
    this.libUrl = "http://flibusta.is";
    this.expires = addDays(365).getTime();
  }

  get values() {
    return {
      Bucket: this.Bucket,
      Key: [this.prefix, this.catalog, this.fileName].filter(Boolean).join("/"),
      ContentType: this.ContentType,
      Body: this.Body,
      ACL: this.ACL,
      Expires: this.expires,
    };
  }
}

class StreamParams extends Params {
  constructor({ catalog, fileName, ...rest }) {
    super({ catalog, fileName });
    this.initStream(rest);
  }

  async initStream({ url, stream, axios }) {
    if (!stream || !axios || !url) {
      throw new Error("Both 'stream' and 'axios', url are required parameters.");
    }

    this.Body = new stream.PassThrough();
    this.axios = axios;
    this.url = url;
  }

  get ContentType() {
    return this.response?.headers["content-type"] || "application/octet-stream";
  }

  set fileName(value) {
    this._fileName = value;
  }

  get fileName() {
    return this._fileName;
  }

  async pipe() {
    try {
      this.response = await this.axios.get(this.url, { responseType: "stream" });
      this.response.data.pipe(this.Body);
    } catch (error) {
      console.error(`Failed to pipe data from URL: ${this.url}`, error);
      throw error;
    }
    return this;
  }
}

class ImageStreamParams extends StreamParams {
  async initStream({ url: image, height, ...rest }) {
    if (!image || !height) {
      throw new Error("'image' URL and 'height' are required parameters.");
    }
    this.height = height;
    const proxy = "https://images.weserv.nl/?url=";

    const url = `${proxy}${encodeURIComponent(this.libUrl + image)}&h=${height}`;
    await super.initStream({ url, ...rest });
  }

  get fileName() {
    return `${this.height}-cover.jpg`;
  }
}

class FileStreamParams extends StreamParams {
  constructor(options) {
    super(options);
    this.prefix = "fb2";
    this.expires = addDays(30).getTime();
  }
  async initStream({ url, ...rest }) {
    const fileUrl = this.libUrl + url;
    await super.initStream({ url: fileUrl, ...rest });
  }
  get fileName() {
    const disposition = this.response?.headers["content-disposition"];
    if (!disposition) {
      throw new Error("Missing 'content-disposition' header in response.");
    }
    const match = disposition.match(/filename="([^"]+)"/);
    return match ? match[1] : "unknown-file";
  }
}

const aws = async () => {
  const AWS = require("aws-sdk");
  const ep = new AWS.Endpoint("hb.bizmrg.com");
  const credentials = {
    accessKeyId: context.values.get("AWS_AccessKeyID"),
    secretAccessKey: context.values.get("AWS_SecretKey"),
  };
  return new AWS.S3({ endpoint: ep, apiVersion: "2006-03-01", credentials });
};

class S3 {
  async init() {
    this._client = await aws();
    return this;
  }
  async upload(params) {
    await this._client.upload(params, (err) => err && console.log(err, JSON.stringify(err)));
  }
}

exports = () => ({
  aws,
  S3,
  Params,
  StreamParams,
  FileStreamParams,
  ImageStreamParams,
});
