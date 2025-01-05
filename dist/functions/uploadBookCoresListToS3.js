const s3Url = "http://flib.s3.hb.ru-msk.vkcloud-storage.ru";
const MAX_PAGE_LENGTH = 100;

const fetchPage = async (pageName) => {
  const axios = require("axios").default;
  const url = `${s3Url}/lists/${pageName}.json`;
  try {
    return await axios.get(url, { responseType: "json" });
  } catch (error) {
    console.log(error);
    return { data: [], next: null };
  }
};

const getBooks = async ({ cursor, limit, direction }) => {
  if (!cursor) return [];

  const Books = context.services.get("mongodb-atlas").db("flibusta").collection("Books");
  return await Books.aggregate([
    {
      $match: {
        _id: { [direction === "before" ? "$gt" : "$lt"]: BSON.ObjectId(cursor._id) },
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
  ]);
};

const uploadPage = async (data, current, next) => {
  const { S3 } = context.functions.execute("aws");
  const s3 = await new S3().init();
  //const uid = isLastPage ? currentPageName : BSON.ObjectId();

  await s3.upload({
    Bucket: "flib.s3",
    Key: `data/lists/${current}.json`,
    ContentType: "application/json",
    Body: JSON.stringify({ data, next }),
  });

  //return `${uid}.json`;
};

class Page {
  constructor({ data = [], ...rest }) {
    Object.assign(this, { data }, rest);
  }
  async upload() {
    this.s3.upload({
      Bucket: "flib.s3",
      Key: `data/lists/${this.name}.json`,
      ContentType: "application/json",
      Body: JSON.stringify({ data: this.data, next: this.next }),
    });
  }
  get length() {
    return this.data.length;
  }
  add(book) {
    this.data.push(book);
  }
  at(index) {
    return this.data.at(index);
  }
}

initS3 = async () => {
  const { S3 } = context.functions.execute("aws");
  const s3 = await new S3().init();
  return s3;
};

const turnPage = (direction, startPageName, isLastPage, prevPage) => {
  if (direction === "before") {
    return {
      name: isLastPage ? startPageName : BSON.ObjectId(),
      next: prevPage.name,
    };
  }
  return {
    name: prevPage.next,
    next: isLastPage ? null : BSON.ObjectId(),
  };
};

exports = async ({ direction = "before", limit, startName = "1_new" }) => {
  const { data, next } = await fetchPage(startName);
  let page = new Page({
    data,
    next: direction === "before" ? next : next ?? BSON.ObjectId(),
    name: startName,
    s3: await initS3(),
  });

  const options = {
    cursor: direction === "before" ? page.at(0) : page.at(-1),
    limit,
    direction,
  };
  const books = await getBooks(options);

  while (true) {
    if (page.length >= MAX_PAGE_LENGTH) {
      await page.upload();

      page = new Page({
        s3: page.s3,
        ...turnPage(direction, startName, books.hasNext(), page),
      });
    }
    if (!books.hasNext()) break;

    page.add(books.next());
  }
};
