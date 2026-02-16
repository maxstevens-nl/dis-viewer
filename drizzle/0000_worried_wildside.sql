CREATE TABLE "fact_dbc" (
	"jaar" integer NOT NULL,
	"behandelend_specialisme_cd" text NOT NULL,
	"typerende_diagnose_cd" text NOT NULL,
	"zorgproduct_cd" text NOT NULL,
	"aantal_pat_per_zpd" integer NOT NULL,
	"aantal_subtraject_per_zpd" integer NOT NULL,
	"aantal_pat_per_diag" integer NOT NULL,
	"aantal_subtraject_per_diag" integer NOT NULL,
	"aantal_pat_per_spc" integer NOT NULL,
	"aantal_subtraject_per_spc" integer NOT NULL,
	"gemiddelde_verkoopprijs" numeric(12, 2),
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL,
	CONSTRAINT "fact_dbc_jaar_behandelend_specialisme_cd_typerende_diagnose_cd_zorgproduct_cd_peildatum_pk" PRIMARY KEY("jaar","behandelend_specialisme_cd","typerende_diagnose_cd","zorgproduct_cd","peildatum")
);
--> statement-breakpoint
CREATE TABLE "fact_dbc_profiel" (
	"jaar" integer NOT NULL,
	"behandelend_specialisme_cd" text NOT NULL,
	"typerende_diagnose_cd" text NOT NULL,
	"zorgproduct_cd" text NOT NULL,
	"zorgactiviteit_cd" text NOT NULL,
	"zorgprofielklasse_cd" text NOT NULL,
	"aantal_pat" integer NOT NULL,
	"aantal_subtraject" integer NOT NULL,
	"aantal_zat" integer NOT NULL,
	"som_aantal_zat" integer NOT NULL,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL,
	CONSTRAINT "fact_dbc_profiel_jaar_behandelend_specialisme_cd_typerende_diagnose_cd_zorgproduct_cd_zorgactiviteit_cd_zorgprofielklasse_cd_peildatum_pk" PRIMARY KEY("jaar","behandelend_specialisme_cd","typerende_diagnose_cd","zorgproduct_cd","zorgactiviteit_cd","zorgprofielklasse_cd","peildatum")
);
--> statement-breakpoint
CREATE TABLE "ref_diagnose" (
	"diagnose_cd" text NOT NULL,
	"specialisme_cd" text NOT NULL,
	"diagnose_omschrijving" text NOT NULL,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL,
	CONSTRAINT "ref_diagnose_diagnose_cd_specialisme_cd_peildatum_pk" PRIMARY KEY("diagnose_cd","specialisme_cd","peildatum")
);
--> statement-breakpoint
CREATE TABLE "ref_specialisme" (
	"specialisme_cd" text PRIMARY KEY NOT NULL,
	"omschrijving" text NOT NULL,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_zorgactiviteit" (
	"zorgactiviteit_cd" text PRIMARY KEY NOT NULL,
	"omschrijving" text NOT NULL,
	"zorgprofielklasse_cd" text NOT NULL,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_zorgproduct" (
	"zorgproduct_cd" text PRIMARY KEY NOT NULL,
	"latijn_oms" text NOT NULL,
	"consument_oms" text NOT NULL,
	"declaratie_verzekerd_cd" text NOT NULL,
	"declaratie_onverzekerd_cd" text,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ref_zorgprofielklasse" (
	"zorgprofielklasse_cd" text PRIMARY KEY NOT NULL,
	"zorgprofielklasse_oms" text NOT NULL,
	"versie" text NOT NULL,
	"datum_bestand" date NOT NULL,
	"peildatum" date NOT NULL
);
