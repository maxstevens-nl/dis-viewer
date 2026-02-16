import { defineQueries, defineQuery, escapeLike } from "@rocicorp/zero";
import { z } from "zod";
import { zql } from "./schema.ts";

export const queries = defineQueries({
  zorgproducten: {
    dbcZorgproducten: defineQuery(() =>
      zql.refZorgproduct.orderBy("zorgproductCd", "asc")
    ),
    search: defineQuery(
      z.object({
        search: z.string(),
      }),
      ({ args: { search } }) => {
        const pattern = `%${escapeLike(search)}%`;
        return zql.refZorgproduct
          .where(({ cmp, or }) =>
            or(
              cmp("zorgproductCd", "ILIKE", pattern),
              cmp("consumentOms", "ILIKE", pattern)
            )
          )
          .orderBy("zorgproductCd", "asc");
      }
    ),
    byCode: defineQuery(z.string(), ({ args: zorgproductCd }) =>
      zql.refZorgproduct.where("zorgproductCd", zorgproductCd).one()
    ),
  },
});
