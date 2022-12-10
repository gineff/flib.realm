/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
exports = async (id) => {
  const axios = require("axios").default;
  const { getLibrary } = context.functions.execute("mainFunctions");

  id = Number.isInteger(id) && id > 0 ? id : 1;

  const Libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Libraries");

  
  const start = new Date();
  const lib = await getLibrary({ _id: id });
  const arr = [lib.mainUrl, lib.reserveUrl];
  const results = [];

  for (const url of arr) {
    console.log(`http://${url}/opds?date=${start.getTime()}`);
    const res = await axios.get("http://flibusta.site/opds", { timeout: 20000, responseType: "text" });
    results.push(res.data ? new Date() - start : 60000);
  }

  const url = results[0] < results[1] ? arr[0] : arr[1];
  console.log(url, JSON.stringify(results));
  Libraries.updateOne({ _id: id }, { $set: { url } });
};
