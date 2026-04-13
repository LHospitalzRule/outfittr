import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { buildApiPath } from "../utils/api";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  storeAccessToken,
} from "../utils/session";

type SearchResponse = {
  results: string[];
  error: string;
  jwtToken?: { accessToken: string };
};

export default function ItemPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [itemName, setItemName] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchFeedback, setSearchFeedback] = useState("");
  const [addFeedback, setAddFeedback] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const userFirstName = user?.firstName || user?.email || "Guest";
  const userId = user?.id;

  if (!user || !userId) {
    clearSession();
    return <Navigate replace to="/" />;
  }

  async function searchItems(event: React.FormEvent) {
    event.preventDefault();
    setIsSearching(true);
    setSearchFeedback("");

    try {
      const response = await fetch(buildApiPath("api/searchitems"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          search: searchTerm,
          jwtToken: getAccessToken(),
        }),
      });

      const result = (await response.json()) as SearchResponse;

      if (result.error) {
        setSearchFeedback(result.error);
        return;
      }

      if (result.jwtToken?.accessToken) {
        storeAccessToken(result.jwtToken.accessToken);
      }

      setSearchResults(result.results || []);
      setSearchFeedback(
        result.results?.length
          ? `${result.results.length} item${result.results.length === 1 ? "" : "s"} found.`
          : "No matching items yet."
      );
    } catch (error) {
      setSearchFeedback("Search failed. Check that the API is running.");
    } finally {
      setIsSearching(false);
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setIsAdding(true);
    setAddFeedback("");

    try {
      const response = await fetch(buildApiPath("api/additem"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          item: itemName,
          jwtToken: getAccessToken(),
        }),
      });

      const result = await response.json();

      if (result.error) {
        setAddFeedback(result.error);
        return;
      }

      if (result.jwtToken?.accessToken) {
        storeAccessToken(result.jwtToken.accessToken);
      }

      setAddFeedback(`"${itemName}" added to your lineup.`);
      setItemName("");
    } catch (error) {
      setAddFeedback("Add item failed. Check that the API is running.");
    } finally {
      setIsAdding(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="closet-page">
      <div className="graffiti-wrapper" />

      <main className="closet-shell">
        <section className="hero-panel">
          <p className="eyebrow">Presentation mode</p>
          <h1>Built for quick wardrobe demos.</h1>
          <p className="hero-copy">
            Search your saved items, add fresh pieces, and walk people through
            the product flow without leaving the page.
          </p>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-label">Current member</span>
              <strong>{userFirstName}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Spotlight item</span>
              <strong>{searchResults[0] || "Nothing searched yet"}</strong>
            </div>
          </div>

          <button className="ghost-button" type="button" onClick={handleLogout}>
            Log out
          </button>
        </section>

        <section className="workspace-panel">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">Collection workspace</p>
              <h2>{userFirstName}&apos;s closet board</h2>
            </div>
          </div>

          <div className="workspace-grid">
            <form className="workspace-card" onSubmit={searchItems}>
              <h3>Search items</h3>
              <p>Look up pieces by name to show what is already in the closet.</p>
              <input
                placeholder="Try hoodie, denim, sneakers..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                required
              />
              <button type="submit" disabled={isSearching}>
                {isSearching ? "Searching..." : "Search collection"}
              </button>
              {searchFeedback ? (
                <p className="form-feedback">{searchFeedback}</p>
              ) : null}
            </form>

            <form className="workspace-card" onSubmit={addItem}>
              <h3>Add an item</h3>
              <p>Capture a new piece on the spot so your presentation stays live.</p>
              <input
                placeholder="Add a new wardrobe item"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                required
              />
              <button type="submit" disabled={isAdding}>
                {isAdding ? "Adding..." : "Add to collection"}
              </button>
              {addFeedback ? <p className="form-feedback">{addFeedback}</p> : null}
            </form>
          </div>

          <section className="results-card">
            <div className="results-header">
              <div>
                <p className="eyebrow">Search results</p>
                <h3>Saved pieces</h3>
              </div>
              <span className="results-count">{searchResults.length} items</span>
            </div>

            {searchResults.length ? (
              <div className="item-grid">
                {searchResults.map((result) => (
                  <article className="item-chip" key={result}>
                    <span className="item-tag">Wardrobe</span>
                    <strong>{result}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                Run a search to show saved items here. This gives you a clean,
                presentation-friendly result list during demos.
              </p>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
