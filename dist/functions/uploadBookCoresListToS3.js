const s3Url = "http://flib.s3.hb.ru-msk.vkcloud-storage.ru";
const MAX_PAGE_LENGTH = 100;

const fetchPage = async (pageName) => {
  const axios = require("axios").default;
  const url = `${s3Url}/lists/${pageName}.json`;
  try {
    const result = await axios.get(url, { responseType: "json" });
    return result.data;
  } catch (error) {
    console.error(`Failed to fetch page: ${url}`, error);
    return { data: [], next: null };
  }
};

const getBooks = async ({ cursor, limit, direction }) => {
  if (!cursor) return [];

  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  const cursorBook = await Books.findOne({ _id: BSON.ObjectId(cursor[0]) });

  if (!cursorBook) return [];

  return await Books.aggregate([
    {
      $match: {
        bid: { [direction === "before" ? "$gt" : "$lt"]: cursorBook.bid },
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
    ...(limit ? [{ $limit: limit }] : []),
  ]).toArray();
};


const initS3 = async () => {
  const { S3 } = context.functions.execute("aws");
  const s3 = await new S3().init();

  return async ({ data, next, current }) => {
    try {
      await s3.upload({
        Bucket: "flib.s3",
        Key: `data/lists/${current}.json`,
        ContentType: "application/json",
        Body: JSON.stringify({ data, next }),
        ACL: "public-read",
      }).promise();
    } catch (error) {
      console.error("S3 upload failed:", error);
      throw error;
    }
  };
};

const Paginator = function* (direction, startPage, items) {
  let page = { ...startPage };
  

  if (direction === "after") {
    page.next ??= BSON.ObjectId();
  } else {
    page.data = [...page.data, ...items.splice(page.data.length - MAX_PAGE_LENGTH)];
  }

  yield page;

  while (items.length > 0) {
    let isLastPage = items.length < MAX_PAGE_LENGTH;
    page =
      direction === "before"
        ? {
            current: !isLastPage ? BSON.ObjectId() : startPage.current,
            next: page.current,
            data: items.splice(-MAX_PAGE_LENGTH),
          }
        : {
            current: page.next,
            next: !isLastPage ? BSON.ObjectId() : null,
            data: items.splice(0, MAX_PAGE_LENGTH),
          };
    yield page;
  }
};

exports = async ({ direction = "before", limit = MAX_PAGE_LENGTH, startName = "1_new" }) => {
  const s3Upload = await initS3();
  const { data, next } = await fetchPage(startName);

  const options = {
    cursor: direction === "before" ? data.at(0) : data.at(-1),
    limit,
    direction,
  };
  const books = await getBooks(options);

  if (!books || books.length === 0) {
    console.log("No books found for the given parameters.");
    return;
  }

  const cores = books.map(({ _id, authors, genres }) => [_id, authors, genres]);
  const pages = Paginator(direction, { current: startName, next, data }, cores);

  for (const page of pages) {
    await s3Upload(page);
  }

  console.log("All pages uploaded successfully.");
};
