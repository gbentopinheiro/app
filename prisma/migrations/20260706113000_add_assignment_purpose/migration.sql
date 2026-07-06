ALTER TABLE `planning_workspace_assignments`
  ADD COLUMN `assignment_purpose` VARCHAR(16) NOT NULL DEFAULT 'work' AFTER `has_work_access`;

UPDATE `planning_workspace_assignments`
SET `assignment_purpose` = 'work'
WHERE `assignment_purpose` <> 'access';

ALTER TABLE `work_assignments`
  ADD COLUMN `assignment_purpose` VARCHAR(16) NOT NULL DEFAULT 'work' AFTER `has_work_access`;

UPDATE `work_assignments`
SET `assignment_purpose` = 'work'
WHERE `assignment_purpose` <> 'access';
