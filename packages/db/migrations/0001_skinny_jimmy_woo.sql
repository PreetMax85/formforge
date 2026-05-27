CREATE UNIQUE INDEX "fields_form_id_order_idx" ON "fields" USING btree ("form_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "response_answers_response_field_idx" ON "response_answers" USING btree ("response_id","field_id");--> statement-breakpoint
CREATE INDEX "responses_form_id_idx" ON "responses" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "responses_ip_address_idx" ON "responses" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "token_blocklist_expires_at_idx" ON "token_blocklist" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_submission_hash_unique" UNIQUE("submission_hash");