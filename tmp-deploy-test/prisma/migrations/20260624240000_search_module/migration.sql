CREATE TABLE "search_analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "query" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "search_analytics_events_query_created_at_idx" ON "search_analytics_events"("query", "created_at" DESC);
CREATE INDEX "search_analytics_events_entity_created_at_idx" ON "search_analytics_events"("entity", "created_at" DESC);
CREATE INDEX "search_analytics_events_created_at_idx" ON "search_analytics_events"("created_at" DESC);
