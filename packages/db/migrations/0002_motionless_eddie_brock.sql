CREATE TABLE "form_drafts" (
	"form_id" uuid PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published_revision" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "fields_form_id_order_idx";--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "retired_at" timestamp;--> statement-breakpoint
ALTER TABLE "form_drafts" ADD CONSTRAINT "form_drafts_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fields_form_id_order_idx" ON "fields" USING btree ("form_id","order") WHERE "fields"."retired_at" IS NULL;