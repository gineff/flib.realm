class Params {
  constructor({ catalog = "", fileName = "", body = "", contentType = "text/plain" }) {
    this.prefix = "core";
    this.Bucket = "flib.s3";
    this.Body = body;
    this.ContentType = contentType;
    this.catalog = catalog;
    this.fileName = fileName;
  }

  get values() {
    return {
      Bucket: this.Bucket,
      Key: `${this.prefix}/${this.catalog}/${this.fileName}`,
      ContentType: this.ContentType,
      Body: this.Body,
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
  }
}

class ImageStreamParams extends StreamParams {
  async initStream({ url: image, height, ...rest }) {
    if (!image || !height) {
      throw new Error("'image' URL and 'height' are required parameters.");
    }
    this.height = height;
    const proxy = "https://images.weserv.nl/?url=";
    const libUrl = "http://flibusta.is";

    const url = `${proxy}${encodeURIComponent(libUrl + image)}&h=${height}`;
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

exports = () => ({
  aws,
  Params,
  StreamParams,
  FileStreamParams,
  ImageStreamParams,
});
