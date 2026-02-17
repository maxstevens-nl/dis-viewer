import { useQuery } from "@rocicorp/zero/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { queries } from "./queries.ts";
import type { RefZorgproduct } from "./schema.ts";

const columns: ColumnDef<RefZorgproduct>[] = [
  {
    accessorKey: "zorgproductCd",
    header: "Code",
    size: 120,
    minSize: 120,
    maxSize: 120,
  },
  {
    accessorKey: "consumentOms",
    header: "Omschrijving",
    size: 0,
    minSize: 0,
  },
];

function App() {
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    function updateScrollMargin() {
      if (!tableContainerRef.current) {
        return;
      }
      setScrollMargin(tableContainerRef.current.offsetTop);
    }

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    const resizeObserver = new ResizeObserver(() => updateScrollMargin());
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateScrollMargin);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [allZorgproducten] = useQuery(
    queries.zorgproducten.dbcZorgproducten()
  );
  const [searchedZorgproducten] = useQuery(
    search ? queries.zorgproducten.search({ search }) : null
  );
  const zorgproducten =
    (search ? searchedZorgproducten : allZorgproducten) ?? [];

  useEffect(() => {
    if (zorgproducten.length === 0) {
      if (selectedCode) {
        setSelectedCode("");
      }
      return;
    }

    const stillExists = zorgproducten.some(
      (product) => product.zorgproductCd === selectedCode
    );
    if (!stillExists && selectedCode !== "") {
      setSelectedCode("");
    }
  }, [selectedCode, zorgproducten]);

  const table = useReactTable({
    data: zorgproducten,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const headerGroups = table.getHeaderGroups();
  const { rows } = table.getRowModel();

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 44,
    overscan: 20,
    scrollMargin,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer, scrollMargin]);

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Zorgproducten</h1>
        <span className="text-sm text-muted-foreground">
          {zorgproducten.length} producten gevonden
        </span>
      </div>

      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Zoek op code of omschrijving..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Separator />

      {zorgproducten.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <em>Geen zorgproducten gevonden</em>
        </div>
      ) : (
        <div className="border rounded-lg bg-card" role="grid" aria-label="Zorgproducten">
          {headerGroups.map((headerGroup) => (
            <div key={headerGroup.id} role="row" className="flex bg-muted">
              {headerGroup.headers.map((header, index) => (
                <div
                  key={header.id}
                  role="columnheader"
                  className={`p-3 text-left border-b font-medium text-muted-foreground ${index === 0 ? "w-[120px] flex-shrink-0" : "flex-1"}`}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </div>
              ))}
            </div>
          ))}
          <div ref={tableContainerRef} role="rowgroup">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                const product = row.original;
                const isSelected = product.zorgproductCd === selectedCode;
                return (
                  <Link
                    key={row.id}
                    to={`/${product.zorgproductCd}`}
                    role="row"
                    aria-selected={isSelected}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    onClick={() => setSelectedCode(product.zorgproductCd)}
                    className={`flex absolute top-0 left-0 w-full cursor-pointer no-underline text-inherit hover:bg-accent/50 ${isSelected ? "bg-accent" : "bg-transparent"}`}
                    style={{
                      transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                      height: `${virtualRow.size}px`,
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <div
                        key={cell.id}
                        role="gridcell"
                        className={`p-3 text-left truncate whitespace-nowrap overflow-hidden ${cellIndex === 0 ? "w-[120px] flex-shrink-0" : "flex-1"} ${virtualRow.index === rows.length - 1 ? "" : "border-b"}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    ))}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
