CREATE TABLE `namespaces` (`id` integer,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,`name` text UNIQUE,PRIMARY KEY (`id`));
CREATE INDEX `idx_namespaces_deleted_at` ON `namespaces`(`deleted_at`);
CREATE TABLE `pre_auth_keys` (`id` integer,`key` text,`namespace_id` integer,`reusable` numeric,`ephemeral` numeric DEFAULT false,`used` numeric DEFAULT false,`created_at` datetime,`expiration` datetime,PRIMARY KEY (`id`));
CREATE TABLE `machines` (`id` integer,`machine_key` varchar(64),`node_key` text,`disco_key` text,`ip_address` text,`name` text,`namespace_id` integer,`registered` numeric,`register_method` text,`auth_key_id` integer,`last_seen` datetime,`last_successful_update` datetime,`expiry` datetime,`host_info` JSON,`endpoints` JSON,`enabled_routes` JSON,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE TABLE `kvs` (`key` text,`value` text);
CREATE TABLE `shared_machines` (`id` integer,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,`machine_id` integer,`namespace_id` integer,PRIMARY KEY (`id`));
CREATE INDEX `idx_shared_machines_deleted_at` ON `shared_machines`(`deleted_at`);
