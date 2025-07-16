-- CreateTable
CREATE TABLE "WordGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WordGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrongWord" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,

    CONSTRAINT "WrongWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordGroup_name_key" ON "WordGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WrongWord_wordId_key" ON "WrongWord"("wordId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WordGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongWord" ADD CONSTRAINT "WrongWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
