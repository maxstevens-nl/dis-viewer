import {
  date,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";

export const refSpecialisme = pgTable("ref_specialisme", {
  specialismeCd: text("specialisme_cd").primaryKey().notNull(),
  omschrijving: text("omschrijving").notNull(),
  versie: text("versie").notNull(),
  datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
  peildatum: date("peildatum", { mode: "string" }).notNull(),
});

export const refZorgprofielklasse = pgTable("ref_zorgprofielklasse", {
  zorgprofielklasseCd: text("zorgprofielklasse_cd").primaryKey().notNull(),
  zorgprofielklasseOms: text("zorgprofielklasse_oms").notNull(),
  versie: text("versie").notNull(),
  datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
  peildatum: date("peildatum", { mode: "string" }).notNull(),
});

export const refZorgactiviteit = pgTable("ref_zorgactiviteit", {
  zorgactiviteitCd: text("zorgactiviteit_cd").primaryKey().notNull(),
  omschrijving: text("omschrijving").notNull(),
  zorgprofielklasseCd: text("zorgprofielklasse_cd").notNull(),
  versie: text("versie").notNull(),
  datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
  peildatum: date("peildatum", { mode: "string" }).notNull(),
});

export const refZorgproduct = pgTable("ref_zorgproduct", {
  zorgproductCd: text("zorgproduct_cd").primaryKey().notNull(),
  latijnOms: text("latijn_oms").notNull(),
  consumentOms: text("consument_oms").notNull(),
  declaratieVerzekerdCd: text("declaratie_verzekerd_cd").notNull(),
  declaratieOnverzekerdCd: text("declaratie_onverzekerd_cd"),
  versie: text("versie").notNull(),
  datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
  peildatum: date("peildatum", { mode: "string" }).notNull(),
});

export const refDiagnose = pgTable(
  "ref_diagnose",
  {
    diagnoseCd: text("diagnose_cd").notNull(),
    specialismeCd: text("specialisme_cd").notNull(),
    diagnoseOmschrijving: text("diagnose_omschrijving").notNull(),
    versie: text("versie").notNull(),
    datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
    peildatum: date("peildatum", { mode: "string" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.diagnoseCd, table.specialismeCd, table.peildatum],
    }),
  })
);

export const factDbc = pgTable(
  "fact_dbc",
  {
    jaar: integer("jaar").notNull(),
    behandelendSpecialismeCd: text("behandelend_specialisme_cd").notNull(),
    typerendeDiagnoseCd: text("typerende_diagnose_cd").notNull(),
    zorgproductCd: text("zorgproduct_cd").notNull(),
    aantalPatPerZpd: integer("aantal_pat_per_zpd").notNull(),
    aantalSubtrajectPerZpd: integer("aantal_subtraject_per_zpd").notNull(),
    aantalPatPerDiag: integer("aantal_pat_per_diag").notNull(),
    aantalSubtrajectPerDiag: integer("aantal_subtraject_per_diag").notNull(),
    aantalPatPerSpc: integer("aantal_pat_per_spc").notNull(),
    aantalSubtrajectPerSpc: integer("aantal_subtraject_per_spc").notNull(),
    gemiddeldeVerkoopprijs: numeric("gemiddelde_verkoopprijs", {
      precision: 12,
      scale: 2,
    }),
    versie: text("versie").notNull(),
    datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
    peildatum: date("peildatum", { mode: "string" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.jaar,
        table.behandelendSpecialismeCd,
        table.typerendeDiagnoseCd,
        table.zorgproductCd,
        table.peildatum,
      ],
    }),
  })
);

export const factDbcProfiel = pgTable(
  "fact_dbc_profiel",
  {
    jaar: integer("jaar").notNull(),
    behandelendSpecialismeCd: text("behandelend_specialisme_cd").notNull(),
    typerendeDiagnoseCd: text("typerende_diagnose_cd").notNull(),
    zorgproductCd: text("zorgproduct_cd").notNull(),
    zorgactiviteitCd: text("zorgactiviteit_cd").notNull(),
    zorgprofielklasseCd: text("zorgprofielklasse_cd").notNull(),
    aantalPat: integer("aantal_pat").notNull(),
    aantalSubtraject: integer("aantal_subtraject").notNull(),
    aantalZat: integer("aantal_zat").notNull(),
    somAantalZat: integer("som_aantal_zat").notNull(),
    versie: text("versie").notNull(),
    datumBestand: date("datum_bestand", { mode: "string" }).notNull(),
    peildatum: date("peildatum", { mode: "string" }).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.jaar,
        table.behandelendSpecialismeCd,
        table.typerendeDiagnoseCd,
        table.zorgproductCd,
        table.zorgactiviteitCd,
        table.zorgprofielklasseCd,
        table.peildatum,
      ],
    }),
  })
);
