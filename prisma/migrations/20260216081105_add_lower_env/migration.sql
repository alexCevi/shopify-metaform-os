-- AlterTable
ALTER TABLE "GitHubConnection" ADD COLUMN     "lowerEnvBranch" TEXT,
ADD COLUMN     "lowerEnvFilePath" TEXT,
ADD COLUMN     "lowerEnvOwner" TEXT,
ADD COLUMN     "lowerEnvRepo" TEXT;
