const getText = async (url)=> {
  const response = await context.http.get({url});
  return response.body.text();
};

exports = getText;