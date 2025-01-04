const s3 = "http://flib.s3.hb.ru-msk.vkcloud-storage.ru";
const currentPageName = "1_new";
const MAX_PAGE_LENGTH = 100;

const getCurrentPage = async () => {
  const axios = require("axios").default;
  const url = `${s3}/lists/${currentPageName}.json`;
  try {
    const list = await axios.get(url, { responseType: "json" });
    return list.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const getBooksEarlierThan = async (bookCursor) => {

  if(!bookCursor) return []

  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  return await Books.aggregate([
    {
      $match: {
        _id: { $gt: BSON.ObjectId(bookCursor._id) },
      },
    },
    {
      $lookup: {
        from: "Genres",
        localField: "genre",
        foreignField: "GenreDesc",
        as: "genresData",
      },
    },
    {
      $project: {
        _id: 1,
        authors: {
          $map: {
            input: "$author",
            as: "auth",
            in: { $toInt: "$$auth.id" },
          },
        },
        genres: {
          $map: {
            input: "$genresData",
            as: "genre",
            in: "$$genre.GenreId",
          },
        },
      },
    },
  ]);
};

function generateSimpleUID() {
  const data = `${new Date().toISOString()}-${Math.random()}`;
  return btoa(data)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
}

const uploadPage = async (data, next, isLastPage) => {
  const { S3 } = context.functions.execute("aws");
  const s3 = await new S3().init();
  const uid = isLastPage ? currentPageName : generateSimpleUID();

  await s3.upload({
    Bucket: "flib.s3",
    Key: `data/lists/${uid}.json`,
    ContentType: "application/json",
    Body: JSON.stringify({ data, next }),
  });

  return `${uid}.json`;
};


exports = async () => {
  let { data: page, next } = getCurrentPage();
  const books = await getBooksEarlierThan(data && data[0]);

  while(true) {
    if (page.length >= MAX_PAGE_LENGTH) {
      next = await uploadPage(page, next, books.hasNext());
      page = [];
    }
    if (!books.hasNext()) break;

    page.push(books.next());
  }
};
