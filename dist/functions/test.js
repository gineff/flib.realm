exports = async ()=> {
  const {getOpds, getLibrary} =  context.functions.execute("mainFunctions");

  const axios = require("axios").default;
  const start = new Date();
  const lib = await getLibrary({_id:1});
  const arr = [lib.mainUrl,lib.reserveUrl];
  let results = [];
  
  for(let url of arr){
    try{
      const res = await axios.get(`http://${url}/opds`, {timeout:15000});
      results.push((new Date()- start));
    }catch (e) {
      console.log("err", e)
      results.push(60000);
    }
  }
  console.log(JSON.stringify(results));
  const url = (results[0] <= results[1])? arr[0] : arr[1];
  console.log(url)

}
