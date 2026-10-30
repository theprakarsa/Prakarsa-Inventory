-- AlterTable
ALTER TABLE `assets` ADD COLUMN `auction_note` TEXT NULL,
    ADD COLUMN `auction_status` ENUM('none', 'lelang', 'diambil') NOT NULL DEFAULT 'none',
    ADD COLUMN `depreciation` DECIMAL(15, 2) NULL,
    ADD COLUMN `legacy_code` VARCHAR(50) NULL,
    ADD COLUMN `ownership` VARCHAR(50) NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `specs` TEXT NULL;
