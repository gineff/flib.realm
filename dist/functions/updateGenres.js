
exports = async () => {
  const axios = require("axios").default;
  const zlib = require("node:zlib");

  const Genres = context.services.get("mongodb-atlas").db("flibusta").collection("Genres");
  const url = "https://flibusta.is/sql/lib.libgenrelist.sql.gz";

  const response = await axios.get(url, { responseType: "arraybuffer" });
  const compressedData = response.data;
  const decompressedData = zlib.gunzipSync(compressedData).toString("utf8");
  const matches = decompressedData.match(/VALUES\s*\((.*?)\);/s);

  if (!matches) {
    console.log("INSERT INTO строки не найдены.");
    return;
  }
  const genresMap = new Map();
  matches[1].split("),(").forEach((item) => {
    const [GenreId, GenreCode, GenreDesc, GenreMeta] = item
      .split(",")
      .map((val) => val.trim().replace(/^'|'$/g, ""));
    const key = `${GenreId}-${GenreDesc}`;
    genresMap.set(key, {
      GenreId: parseInt(GenreId),
      GenreCode,
      GenreDesc,
      GenreMeta,
    });
  });

  
  const bulkOps = [];

  bulkOps.push({
    updateMany: {
      filter: {}, 
      update: { $set: { status: "obsolete" } },
    },
  });
  
  genresMap.forEach((value) => {
    const { GenreId, GenreDesc, ...rest } = value;
    bulkOps.push({
      updateOne: {
        filter: { GenreId, GenreDesc }, 
        update: { $set: { ...rest, status: "active" } },
        upsert: true, // Добавляем запись, если не найдена
      },
    });
  });
  
  await Genres.bulkWrite(bulkOps);
  

  const { aws, Params } = context.functions.execute("aws");
  const clientS3 = await aws();
  const genres = await Genres.find({ status: { $ne: "obsolete" } }).toArray();

  await clientS3.upload(
    {
      Bucket: "flib.s3",
      Key: "data/genres.json",
      ContentType: "application/json",
      Body: JSON.stringify({ data: genres }),
    },
    (err) => err && console.log(err, JSON.stringify(err))
  );

};
