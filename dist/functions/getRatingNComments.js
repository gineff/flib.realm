


const commentParser = async (text)=> {
  const matchAll = require("string.prototype.matchall");
  const matchesComments = Array.from(matchAll(text,/<span class="container_.*?>(.*?)<\/span>/gm));

  const comments = matchesComments.map(el=>{
    
    const html = el[1];
    const matchAuthor = Array.from(matchAll(html,/<b><a href=.*?>(.*?)<\/a><\/b>/gm));
    const matchDate = Array.from(matchAll(html,/(\d{2}:\d{2} \(.*?\) \/ \d{2}-\d{2}-\d{4})/gm));
    const matchMark =  Array.from(matchAll(html,/Оценка: (.*?)</gm));
    const matchText =  (Array.from(matchAll(html,/br>((.|\n)*)<div/gm)));
    
    const result =  {
      author: matchAuthor[0] && matchAuthor[0][1],
      date: matchDate[0] && matchDate[0][1],
      mark: matchMark[0] && matchMark[0][1],
      text: matchText[0] && matchText[0][1].replace(/<br>/g,"\n")
      
    };
    
    return result;
  })

  const matchesRecommendation = Array.from(matchAll(text,/bdata=id\">(\d+) пользователей<\/a>/g));
  const recommendation = matchesRecommendation[0] && matchesRecommendation[0][1];
  const matchesMarks =  Array.from(matchAll(text,/<p>Оценки: (\d+),.*?(\d\.*\d*)<\/p>/g));
  const marks = matchesMarks[0] && [matchesMarks[0][1], matchesMarks[0][2]]
  return  {recommendation, comments, marks}

};

const getText = async (url)=> {
  const response = await context.http.get({url});
  return response.body.text();
};

const getList  = async function() {
  
  const libraries = context.services.get("mongodb-atlas").db("flibusta").collection("Libraries");
  
  const lib = await libraries.findOne({_id:1});
  const lists = ["w","24"]
  let set = new Set();
  lists.forEach(el=> {
    set = new Set([...set,...lib[`list-${el}`]])
  })
  return set;
}

const getComments = async function(booksId) {

  const comments = [];
  booksId  = booksId? (Array.isArray(booksId)? booksId : [booksId]) : await getList();

  for(let id of booksId) {
    const text = await getText(`http://flibusta.is/b/${id}`);
    const comment = await commentParser(text);
    comments.push(comment);
  }

  return comments.length>1? comments : comments[0];
};

 
exports = getComments;
