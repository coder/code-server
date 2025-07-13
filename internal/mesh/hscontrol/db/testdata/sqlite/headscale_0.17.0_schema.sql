CREATE TABLE `namespaces` (`id` integer,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,`name` text UNIQUE,PRIMARY KEY (`id`));
CREATE INDEX `idx_namespaces_deleted_at` ON `namespaces`(`deleted_at`);
CREATE TABLE `pre_auth_keys` (`id` integer,`key` text,`namespace_id` integer,`reusable` numeric,`ephemeral` numeric DEFAULT false,`used` numeric DEFAULT false,`created_at` datetime,`expiration` datetime,PRIMARY KEY (`id`));
CREATE TABLE `machines` (`id` integer,`machine_key` varchar(64),`node_key` text,`disco_key` text,`ip_addresses` text,`hostname` text,`given_name` varchar(63),`namespace_id` integer,`register_method` text,`forced_tags` text,`auth_key_id` integer,`last_seen` datetime,`last_successful_update` datetime,`expiry` datetime,`host_info` text,`endpoints` text,`enabled_routes` text,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));
CREATE TABLE `kvs` (`key` text,`value` text);
CREATE TABLE `pre_auth_key_acl_tags` (`id` integer,`pre_auth_key_id` integer,`tag` text,PRIMARY KEY (`id`));
CREATE TABLE `api_keys` (`id` integer,`prefix` text,`hash` blob,`created_at` datetime,`expiration` datetime,`last_seen` datetime,PRIMARY KEY (`id`));
CREATE UNIQUE INDEX `idx_api_keys_prefix` ON `api_keys`(`prefix`);
