import { useQuery } from "@rocicorp/zero/react";
import { useEffect, useState } from "react";
import { queries } from "./queries.ts";

function App() {
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState("");

  const [allZorgproducten] = useQuery(
    queries.zorgproducten.dbcZorgproducten()
  );
  const [searchedZorgproducten] = useQuery(
    search ? queries.zorgproducten.search({ search }) : null
  );
  const zorgproducten =
    (search ? searchedZorgproducten : allZorgproducten) ?? [];
  const [selectedProduct] = useQuery(
    selectedCode ? queries.zorgproducten.byCode(selectedCode) : null
  );

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
    if (!stillExists) {
      setSelectedCode(zorgproducten[0].zorgproductCd);
    }
  }, [selectedCode, zorgproducten]);

  return (
    <>
      <div className="controls">
        <div>
          Search:
          <input
            type="text"
            placeholder="code or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <div>
          <em>
            {search
              ? `Found ${zorgproducten.length} zorgproducten`
              : `Showing ${zorgproducten.length} zorgproducten`}
          </em>
        </div>
      </div>
      {zorgproducten.length === 0 ? (
        <h3>
          <em>No zorgproducten found</em>
        </h3>
      ) : (
        <table border={1} cellSpacing={0} cellPadding={6} width="100%">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {zorgproducten.map((product) => (
              <tr
                key={product.zorgproductCd}
                onClick={() => setSelectedCode(product.zorgproductCd)}
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    product.zorgproductCd === selectedCode
                      ? "#f2f2f2"
                      : "transparent",
                }}
              >
                <td align="left">{product.zorgproductCd}</td>
                <td align="left">{product.consumentOms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedProduct ? (
        <div className="controls">
          <div>
            <strong>Selected zorgproduct</strong>
          </div>
          <div>Code: {selectedProduct.zorgproductCd}</div>
          <div>Consument omschrijving: {selectedProduct.consumentOms}</div>
          <div>Latijn omschrijving: {selectedProduct.latijnOms}</div>
          <div>
            Declaratie verzekerd: {selectedProduct.declaratieVerzekerdCd}
          </div>
          <div>
            Declaratie onverzekerd: {selectedProduct.declaratieOnverzekerdCd}
          </div>
          <div>Versie: {selectedProduct.versie}</div>
          <div>Datum bestand: {selectedProduct.datumBestand}</div>
          <div>Peildatum: {selectedProduct.peildatum}</div>
        </div>
      ) : null}
    </>
  );
}

export default App;
