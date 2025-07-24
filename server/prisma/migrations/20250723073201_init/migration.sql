-- CreateTable
CREATE TABLE "TDProject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "lastSeen" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "TDProject_name_key" ON "TDProject"("name");
