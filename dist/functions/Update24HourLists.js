exports = async function update24HoursLists() {
  context.functions.execute("getBooksFromList", "24");
};
