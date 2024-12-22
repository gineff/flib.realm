exports = async function updateWeekList() {
  context.functions.execute("getBooksFromList", "w");
};
