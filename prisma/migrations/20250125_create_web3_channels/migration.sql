
-- CreateTable
CREATE TABLE IF NOT EXISTS "web3_channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_uri" TEXT,
    "created_by" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "subscriber_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web3_channels_pkey" PRIMARY KEY ("id")
);
