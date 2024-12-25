const uploadGenres = async (clientS3, genres) => {
  await clientS3.upload({
    Bucket: "flib.s3",
    Key: "data/genres.json",
    ContentType: "application/json",
    Body: JSON.stringify({ data: genres }),
  });
};

const updateSettings = async () => {
  const Settings = context.services.get("mongodb-atlas").db("flibusta").collection("Settings");
  const updatedSettings = await Settings.findOneAndUpdate(
    { _id: "general" },
    { $set: { genresUpdateDate: new Date() } },
    {
      upsert: true,
      returnDocument: "after",
    }
  );
  return updatedSettings;
};

const uploadSettings = async (clientS3, settings) => {
  await clientS3.upload({
    Bucket: "flib.s3",
    Key: "data/settings.json",
    ContentType: "application/json",
    Body: JSON.stringify({ data: settings }),
  });
};

const getSQL = async () => {
  const axios = require("axios").default;
  const zlib = require("node:zlib");
  const url = "https://flibusta.is/sql/lib.libgenrelist.sql.gz";

  const response = await axios.get(url, { responseType: "arraybuffer" });
  const compressedData = response.data;
  const decompressedData = zlib.gunzipSync(compressedData).toString("utf8");
  return decompressedData;
};

const parseSQL = (sql) => {
  const matches = sql.match(/VALUES\s*\((.*?)\);/s);
  if (!matches) {
    throw new Error("INSERT INTO строки не найдены.");
  }

  const genres = matches[1].split("),(").map((item) => {
    const [GenreId, GenreCode, GenreDesc, GenreMeta] = item
      .split(",")
      .map((val) => val.trim().replace(/^'|'$/g, ""));
    return {
      GenreId: parseInt(GenreId),
      GenreCode,
      GenreDesc,
      GenreMeta,
    };
  });
  return genres;
};

class S3 {
  async init() {
    const { aws } = context.functions.execute("aws");
    this._client = await aws();
    return this;
  }
  async upload(params) {
    await this._client.upload(params, (err) => err && console.log(err, JSON.stringify(err)));
  }
}

exports = async () => {
  const Genres = context.services.get("mongodb-atlas").db("flibusta").collection("Genres");
  const s3 = await new S3().init();

  try {
    const sql = await getSQL();
    const genres = parseSQL(sql);

    await Genres.deleteMany({});
    await Genres.insertMany(genres);

    await uploadGenres(s3, genres);
    const settings = await updateSettings();
    await uploadSettings(s3, settings);

    return genres;
  } catch (e) {
    console.log(e);
  }
};
