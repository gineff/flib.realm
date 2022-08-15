exports = async ()=> {
  try{
    const res = await context.http.get({url:"http://flibusta.lib/favicon.ico"});
    const text = res.text();
    console.log(text);
  }catch (e) {
    console.log("err", e)
  }

}
