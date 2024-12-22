exports = async () => {
  const axios = require("axios").default;
  const zlib = require("node:zlib");
  const fs = require("node:fs");

  const Genres = context.services.get("mongodb-atlas").db("flibusta").collection("Genres");
  const url = "https://flibusta.is/sql/lib.libgenrelist.sql.gz";

  const response = await axios.get(url, { responseType: "arraybuffer" });
  const compressedData = response.data;

  // 2. Распаковываем архив
  const decompressedData = zlib.gunzipSync(compressedData).toString("utf8");

  // 3. Ищем строки с `INSERT INTO`
  const matches = decompressedData.match(/INSERT INTO .*? VALUES \((.*?)\);/g);

  if (!matches) {
    console.log("INSERT INTO строки не найдены.");
    return;
  }

  console.log(JSON.stringify(matches));
  // 4. Обрабатываем строки
  const result = matches.map((insertQuery) => {
    //const valuesMatch = insertQuery.match(/\((.*?)\)/g);
  });
};
