ALTER TABLE `work_assignments`
  ADD COLUMN `hours_created_at` DATETIME(3) NULL AFTER `hours`,
  ADD COLUMN `hours_created_by_user_id` INTEGER NULL AFTER `hours_created_at`,
  ADD COLUMN `hours_created_by_name` VARCHAR(191) NULL AFTER `hours_created_by_user_id`,
  ADD COLUMN `hours_updated_at` DATETIME(3) NULL AFTER `hours_created_by_name`,
  ADD COLUMN `hours_updated_by_user_id` INTEGER NULL AFTER `hours_updated_at`,
  ADD COLUMN `hours_updated_by_name` VARCHAR(191) NULL AFTER `hours_updated_by_user_id`;
