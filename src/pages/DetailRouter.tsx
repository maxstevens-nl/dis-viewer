import { useParams } from "react-router-dom";
import ProductDetail from "./ProductDetail.tsx";
import SpecialismDetail from "./SpecialismDetail.tsx";

function DetailRouter() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return null;
  }

  if (/^\d{4}$/.test(id)) {
    return <SpecialismDetail />;
  }

  if (/^\d{9}$/.test(id)) {
    return <ProductDetail />;
  }

  return null;
}

export default DetailRouter;
