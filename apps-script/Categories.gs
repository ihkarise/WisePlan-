/**
 * Categories.gs
 * Read the Categories sheet into an ordered, grouped structure the client uses
 * to render category and subcategory chips. No hardcoded values on the client.
 */

/**
 * @return {Array<{name:string, subCategories:string[]}>} active categories in
 * SortOrder, each with its non-empty subcategories.
 */
function getCategories() {
  var rows = readObjects(SHEETS.CATEGORIES)
    .filter(function (r) { return isActive(r.Active); })
    .sort(function (a, b) { return sortValue(a) - sortValue(b); });

  var order = [];
  var byName = {};
  rows.forEach(function (r) {
    var name = String(r.Category || '').trim();
    if (!name) {
      return;
    }
    if (!byName[name]) {
      byName[name] = { name: name, subCategories: [] };
      order.push(byName[name]);
    }
    var sub = String(r.SubCategory || '').trim();
    if (sub) {
      byName[name].subCategories.push(sub);
    }
  });
  return order;
}

function sortValue(row) {
  var n = Number(row.SortOrder);
  return isNaN(n) ? 9999 : n;
}
