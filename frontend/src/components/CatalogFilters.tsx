import { CATEGORY_LABELS, type Category } from "../lib/types";

export function CatalogFilters({
  query, category, onQueryChange, onCategoryChange, onClear,
}: {
  query: string;
  category: Category | "all";
  onQueryChange: (q: string) => void;
  onCategoryChange: (c: Category | "all") => void;
  onClear: () => void;
}) {
  return (
    <form className="row" role="search" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="catalog-search">Search</label>
        <input id="catalog-search" type="search" value={query}
          onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <div>
        <label htmlFor="catalog-category">Category</label>
        <select id="catalog-category" value={category}
          onChange={(e) => onCategoryChange(e.target.value as Category | "all")}>
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>
      <button type="button" className="secondary" onClick={onClear}>Clear filters</button>
    </form>
  );
}
