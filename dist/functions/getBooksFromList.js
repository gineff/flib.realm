const getList  = async function(listId) {

listId = "w";
  
  const collection = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const searchUrl = 'http://flibusta.is/opds/opensearch?searchType=books&searchTerm=';

  const getOpds = async (url)=> {
    const response = await context.http.get({url});
    return response.body.text();
  };

  const getBooks = async (url)=> {
    const opds = await getOpds(url);
    const books = context.functions.execute("xmlParserFlibusta", opds);
    return  books;
  };
  
  const searchBooks = async (str, page)=> {
    const opds = await getOpds(searchUrl+str+"&pageNumber="+page);
    return context.functions.execute("xmlParserFlibusta", opds);
  }
  
  const text = await getOpds('http://flibusta.is/stat/'+listId);
  const matches =  Array.from(text.matchAll(/- <a href="\/b\/(.*?)">(.*?)<\/a>/g));
  const links = matches.slice(0,10).map(el=>({id:el[1],title:el[2]}));
  
  const _books = [];
  
  for(let link of links) {
    let book, books = [], page = 0;
    do{
      try{
        const str = link.title.replace(/\[.*?\]/g,"").trim();
        console.log(links.indexOf(link),str)
        const encodeStr = encodeURIComponent(str);
        const id = link.id;
        console.log("str", str);
        books = await searchBooks(encodeStr, page);
        book = books.filter(el=>{return el.bid===id})[0];
        if(book) {_books.push(book)}
        page++;
                console.log(book && book.bid, books.length, page);
      }catch(e){
        console.log('error',JSON.stringify(e))
       // break;
      }
      
    }while(
      !book && books.length === 20 && page<20
      )
    
    //.filter(el=>el.bid == link.id)[0];

        
  } 
    
 // console.log(JSON.stringify(books));


};

exports = getList;