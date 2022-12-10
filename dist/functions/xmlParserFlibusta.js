/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
const matchAll = require("string.prototype.matchall");
const { DOMParser } = require("xmldom");

function xmlToJson(xml) {
  if (typeof xml === "string") {
    xml = new DOMParser().parseFromString(xml, "application/xml");
  }

  const now = new Date();
  const books = [];
  const feed = xml.childNodes.item(0).nodeName === "feed" ? xml.childNodes.item(0) : xml.childNodes.item(2);
  // console.log("feed",feed);
  for (let i = 0; i < feed.childNodes.length; i++) {
    const item = feed.childNodes.item(i);
    if (item.nodeName === "entry") {
      const book = { author: [], genre: [], sequencesId: [], downloads: [] };
      for (let ii = 0; ii < item.childNodes.length; ii++) {
        const el = item.childNodes.item(ii);
        if (el.nodeName === "title") {
          book.title = el.textContent;
        } else if (el.nodeName === "content") {
          book.content = el.textContent;
          const res = Array.from(matchAll(book.content, /Серия: (.*?)<br\/>/g));
          book.sequencesTitle = res.map((_el) => _el[1]);
        } else if (el.nodeName === "author") {
          const author = {};
          author.name = el.childNodes.item(1).textContent;
          author.id = el.childNodes.item(3).textContent.split("/")[2];
          book.author.push(author);
        } else if (el.nodeName === "category") {
          book.genre.push(el.getAttribute("term"));
        } else if (el.nodeName === "link") {
          const type = el.getAttribute("type");
          const href = el.getAttribute("href");
          const rel = el.getAttribute("rel");

          if (type === "image/jpeg" && !book.image) {
            book.image = href;
          } else if (href && /sequencebooks/.test(href)) book.sequencesId.push(href.split("/").pop());
          else if (rel === "http://opds-spec.org/acquisition/open-access") {
            book.downloads.push({ href, type });
          } else if (rel === "alternate") {
            book.bid = href.split("/").pop();
            book.s3 = false;
            book.lid = 1;
            book.date = now;
          }
        }
      }
      books.push(book);
    }
  }

  return books;
}

exports = xmlToJson;
