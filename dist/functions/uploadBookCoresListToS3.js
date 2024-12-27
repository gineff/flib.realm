const getLastPage = async () => {
  const axios = require("axios").default;
  const s3 = "http://flib.s3.hb.ru-msk.vkcloud-storage.ru";
  const url = `${s3}/lists/1_new.json`;
  try {
    const list = await axios.get(url, { responseType: "json" });
    return list.data;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const getBooks = async (_id) => {
  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  return await Books.aggregate([
    {
      $match: {
        _id: { $gt: BSON.ObjectId(_id) },
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

const uploadPage = (page, next) => {};

exports = async () => {
  const PAGE_LENGTH = 100;
  let { data: page, next } = getLastPage();
  const lastBook = data[0];
  const lastBookId = lastBook ? lastBook._id : null;
  const books = await getBooks(lastBookId);

  
  for await (const book of books) {
    
    page.push(book);
    if (page.length >= PAGE_LENGTH || !books.hasNext()) {
      next = uploadPage(page, next);
      page.length = 0;
    }


  }
};
