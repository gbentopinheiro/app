CREATE TABLE `work_extra_access_grants` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `person_id` INTEGER NOT NULL,
  `work_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `work_extra_access_grants_person_id_work_id_key`(`person_id`, `work_id`),
  INDEX `work_extra_access_grants_person_id_idx`(`person_id`),
  INDEX `work_extra_access_grants_work_id_idx`(`work_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `work_extra_access_grants`
  ADD CONSTRAINT `work_extra_access_grants_person_id_fkey`
    FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `work_extra_access_grants_work_id_fkey`
    FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `work_extra_access_grants` (`person_id`, `work_id`)
SELECT DISTINCT `person_id`, `work_id`
FROM `planning_workspace_assignments`
WHERE `assignment_purpose` = 'access'

UNION

SELECT DISTINCT `person_id`, `work_id`
FROM `work_assignments`
WHERE `assignment_purpose` = 'access'
ON DUPLICATE KEY UPDATE `work_id` = `work_id`;
