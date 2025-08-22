-- CreateTable
CREATE TABLE "public"."Channel" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "twitter" TEXT,
    "discord" TEXT,
    "imageUri" TEXT,
    "bannerImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_tokenAddress_key" ON "public"."Channel"("tokenAddress");
