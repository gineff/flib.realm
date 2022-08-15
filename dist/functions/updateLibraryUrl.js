exports = async (id)=> {
  id = id || 1;
  const {getOpds, getLibrary} =  context.functions.execute("mainFunctions");
  const Libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  
  const axios = require("axios").default;
  const start = new Date();
  const lib = await getLibrary({_id:id});
  const arr = [lib.mainUrl,lib.reserveUrl];
  let results = [];
  
  for(let url of arr){
    try{
      const res = await axios.get(`http://${url}/opds?date=${start}`, {timeout:20000});
      results.push((new Date()- start));
    }catch (e) {
      results.push(60000);
    }
  }

  const url = (results[0] <= results[1])? arr[0] : arr[1];
  console.log(url, JSON.stringify(results));
  Libraries.updateOne({_id:1},{$set:{url}})

}
