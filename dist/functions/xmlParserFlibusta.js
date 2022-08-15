const xmlToJson = function(xml) {

  if(typeof xml === "string") {
  const { DOMParser } = require('xmldom')
    xml = new DOMParser().parseFromString(xml, "application/xml");
  }

  const now = new Date();
  const books = [];
  const feed = xml.childNodes.item(0).nodeName === "feed"? xml.childNodes.item(0): xml.childNodes.item(2);
// console.log("feed",feed);
  for (let i = 0; i < feed.childNodes.length; i++) {
    let item = feed.childNodes.item(i);
    if(item.nodeName === 'entry') {
      let book = {author:[], genre: [], sequencesId: [], downloads: []};
      for (let ii = 0; ii < item.childNodes.length; ii++) {
        let el = item.childNodes.item(ii);
        if(el.nodeName === 'title') {
          book.title = el.textContent;
        }else if(el.nodeName === 'content') {
          book.content = el.textContent;
          let res =  Array.from( book.content.matchAll(/Серия: (.*?)<br\/>/g));
          book.sequencesTitle = res.map(el=>el[1]);
        }else if(el.nodeName === 'author') {
          let author = {};
          author.name = el.childNodes.item(1).textContent;
          author.id = el.childNodes.item(3).textContent.split('/')[2];
          book.author.push(author);
        }else if(el.nodeName === 'category') {
          book.genre.push(el.getAttribute('term'));
        }else if(el.nodeName === 'link') {
          let type = el.getAttribute('type');
          let href = el.getAttribute('href');
          let rel = el.getAttribute('rel');

          if (type === "image/jpeg" && !book.image) {
            book.image =  href;
          } else if (href && /sequencebooks/.test(href) )
            book.sequencesId.push(href.split("/").pop());
          else if (rel === "http://opds-spec.org/acquisition/open-access") {
            book.downloads.push({href: href, type});
          }else if(rel === 'alternate'){
            book.bid = href.split("/").pop();
            book.lb_index="1-"+book.bid
            book.lid = 1;
            book.date = now;
          }
        }

      }
      books.push(book);
    }
  }

  return books;
};

exports =  xmlToJson;
