import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import MenuCard from "./components/MenuCard";
import CategoryFilter from "./components/CategoryFilter";
import menuItems from "./data/menuItems";
import type { MenuItem } from "./data/menuItems";

const ARViewer = lazy(() => import("./components/ARViewer"));

export function ARMenu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [arItem, setArItem] = useState<MenuItem | null>(null);

  const categories = useMemo(
    () => [...new Set(menuItems.map((item) => item.category))],
    []
  );

  const filteredItems = useMemo(
    () =>
      activeCategory === "All"
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const handleViewAR = useCallback((item: MenuItem) => {
    setArItem(item);
  }, []);

  const handleCloseAR = useCallback(() => {
    setArItem(null);
  }, []);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "0 16px 32px",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <header
        style={{
          textAlign: "center",
          padding: "24px 0 16px",
          background: "#fff",
          margin: "0 -16px 20px",
          borderBottom: "1px solid #eee",
          paddingLeft: 16,
          paddingRight: 16,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          Menu
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 14,
            color: "#888",
          }}
        >
          Tap "View in AR" to see dishes on your table
        </p>
      </header>

      <main>
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} onViewAR={handleViewAR} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "#aaa",
              padding: "48px 0",
              fontSize: 15,
            }}
          >
            No items in this category.
          </p>
        )}
      </main>

      {arItem && (
        <Suspense fallback={null}>
          <ARViewer item={arItem} onClose={handleCloseAR} />
        </Suspense>
      )}
    </div>
  );
}
