/*
  Warnings:

  - The primary key for the `Genre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_MovieGenres` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_TvShowGenres` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "_MovieGenres" DROP CONSTRAINT "_MovieGenres_A_fkey";

-- DropForeignKey
ALTER TABLE "_TvShowGenres" DROP CONSTRAINT "_TvShowGenres_A_fkey";

-- AlterTable
ALTER TABLE "Genre" DROP CONSTRAINT "Genre_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Genre_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_MovieGenres" DROP CONSTRAINT "_MovieGenres_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_MovieGenres_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "_TvShowGenres" DROP CONSTRAINT "_TvShowGenres_AB_pkey",
ALTER COLUMN "A" SET DATA TYPE TEXT,
ADD CONSTRAINT "_TvShowGenres_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "_MovieGenres" ADD CONSTRAINT "_MovieGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TvShowGenres" ADD CONSTRAINT "_TvShowGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
