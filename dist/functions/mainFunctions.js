
///// Parsing

const getText = async (url)=> {
  const axios = require('axios').default;
  let text;
  try{
    text = await axios.get(url, {timeout: 30000, responseType: "text"});
    //const response = await context.http.get({url});
    //text = response.body.text();
  }catch (e) {
    text = "";
  }
  return text;
};

const getOpds = async (url)=> {
  const response = await context.http.get({url});
  return response.body.text();
};

const xmlParser = (text)=> {
  return context.functions.execute("xmlParserFlibusta", text);
};

const htmlParser = (type, text)=> {

  if(type === "List") {
    const matches = Array.from(text.matchAll(/<a href="\/a\/(.*?)">(.*?)<\/a> - <a href="\/b\/(.*?)">(.*?)<\/a>/g));
    return  matches.map(el=>({
      bid:el[3],
      author:[{name:el[2], id: el[1]}],
      title:el[4],
      sequencesTitle: [],
    }));
  }else{
    return [];
  }

};

/////// Collections

const getCollection = (db,name)=> {
  return context.services.get("mongodb-atlas").db(db).collection(name);
}

const getLibrary = async (query) => {
  const libraries = getCollection("flibusta", "Libraries");
  let library;
  try{
    library = await libraries.findOne(query);
  }catch (e) {
    return false;
  }
  return library;
}

const checkLibrarySiteStatus = async (query)=> {
  const library = await getLibrary(query);
  if(!library) return 4// mongodb is unavailable
  return library.status;
  // 1 site is available;
  // 2 reserve site is available;
  // 3 site is unavailable;
  // false mongodb unavailable
}

const checkResourceIsAvailable = (url)=> {

}

const getLibraryUrl = async (query)=> {
  const { url } = await getLibrary(query);

  return url;
}


exports = ()=>{return {getText, getOpds, xmlParser, htmlParser, getLibrary, checkLibrarySiteStatus, getLibraryUrl}}
